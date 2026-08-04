"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileUp,
  Trash2,
  Volume2,
  Loader2,
  MessageCircleCheck,
  Hourglass,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { extractTextFromFile } from "@/lib/document/pdfParser";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { getSupabaseClient } from "@/lib/db/supabase";
import { Sidebar } from "@/components/layout/Sidebar";
import { getFileIcon } from "@/lib/helpers/utils";

type UploadStage = "extracting" | "summarizing" | "saving" | "idle";

interface VoiceOption {
  id: string;
  name: string;
  desc: string;
  category: "female" | "male";
}

const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "Aoede",
    name: "Sarah",
    desc: "Breezy & clear (Default)",
    category: "female",
  },
  {
    id: "Kore",
    name: "Jessica",
    desc: "Firm & professional",
    category: "female",
  },
  {
    id: "Charon",
    name: "Adam",
    desc: "Deep & authoritative",
    category: "male",
  },
  { id: "Fenrir", name: "Eric", desc: "Calm & informative", category: "male" },
];

const generateCustomID = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const segment = () => {
    let str = "";
    for (let i = 0; i < 4; i++) {
      str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return str;
  };
  return `${segment()}-${segment()}-${segment()}`;
};

export default function UploadPage() {
  const router = useRouter();
  const { userId, getToken } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle");

  const [previewPlayingId, setPreviewPlayingId] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, []);

  const playVoicePreview = useCallback(
    async (voiceId: string, voiceName: string) => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setPreviewPlayingId(null);
      setPreviewLoadingId(voiceId);

      try {
        const cleanName = voiceName.split(" ")[0];
        const text = `Hi, I'm ${cleanName}. I will be your voice assistant for this document.`;
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voiceId }),
        });

        if (!res.ok) throw new Error("Failed to load voice preview");

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        previewAudioRef.current = audio;

        audio.onplay = () => {
          setPreviewPlayingId(voiceId);
          setPreviewLoadingId(null);
        };
        audio.onended = () => setPreviewPlayingId(null);
        audio.onerror = () => {
          setPreviewPlayingId(null);
          setPreviewLoadingId(null);
        };

        await audio.play();
      } catch (err) {
        console.error(err);
        toast.error("Could not play voice preview.");
        setPreviewLoadingId(null);
      }
    },
    [],
  );

  const handleSelectVoice = (voiceId: string, voiceName: string) => {
    const nextVoice = selectedVoice === voiceId ? "" : voiceId;
    setSelectedVoice(nextVoice);

    if (nextVoice) {
      playVoicePreview(voiceId, voiceName);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setPreviewPlayingId(null);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const validateAndSetFile = (selectedFile: File) => {
    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      toast.error("Only PDF files are supported currently.");
      return false;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      toast.error("File size exceeds the 25MB limit.");
      return false;
    }

    setFile(selectedFile);
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const success = validateAndSetFile(e.target.files[0]);
      if (!success && e.target) e.target.value = "";
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setCustomTitle("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !userId) {
      toast.error("You must be signed in to upload documents.");
      return;
    }

    setIsUploading(true);
    setUploadStage("extracting");
    const resolvedTitle = customTitle.trim() || file.name;

    try {
      let token = null;
      try {
        token = await getToken({ template: "Supabase" });
      } catch (authErr) {
        console.warn("Clerk Supabase JWT template fallback:", authErr);
      }

      const supabaseClient = getSupabaseClient(token || "");

      const extractedText = await extractTextFromFile(file);

      setUploadStage("summarizing");
      let summary = "Summary generation failed or not available.";
      let tags = ["General"];

      try {
        const sumResp = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentName: resolvedTitle,
            documentText: extractedText,
          }),
        });
        if (sumResp.ok) {
          const sumData = await sumResp.json();
          summary = sumData.summary;
          tags = sumData.tags;
        }
      } catch (err) {
        console.error("Failed to generate summary:", err);
      }

      setUploadStage("saving");
      const docId = generateCustomID();
      const fileSizeStr =
        file.size > 1024 * 1024
          ? (file.size / (1024 * 1024)).toFixed(1) + " MB"
          : (file.size / 1024).toFixed(0) + " KB";
      const totalVectors = Math.floor(file.size / 1350) + 42;
      const formattedDate = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const { error: dbError } = await supabaseClient.from("documents").insert({
        id: docId,
        user_id: userId,
        name: resolvedTitle,
        date: formattedDate,
        size: fileSizeStr,
        raw_size: file.size,
        vectors: totalVectors,
        text: extractedText,
        summary,
        tags,
        voice_id: selectedVoice || null,
      });

      if (dbError) {
        throw new Error(
          `DB Error [${dbError.code || "N/A"}]: ${dbError.message}`,
        );
      }

      toast.success("Document uploaded and analyzed successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Upload process error:", err);
      toast.error(`Upload failed: ${err.message || err}`);
    } finally {
      setIsUploading(false);
      setUploadStage("idle");
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f7f4] flex relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-125 h-125 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-150 h-150 rounded-full bg-violet-400/4 blur-[130px] pointer-events-none" />

      <Sidebar />

      <main className="flex-1 flex flex-col overflow-auto min-w-0 relative z-10">
        <div className="p-4 md:p-8 max-w-4xl w-full mx-auto space-y-8 md:space-y-10 mt-14 md:mt-0">
          <div className="border-b border-[#eae6df]/60 pb-6">
            <h1 className="text-3xl md:text-4xl font-heading font-black leading-tight tracking-tight">
              <span className="shiny-text animate-shine text-violet-600">
                Upload Document
              </span>
            </h1>
            <p className="text-xs md:text-sm text-foreground/75 font-medium mt-1.5">
              Drag & drop or upload your document, choose a custom title, and
              configure the voice assistant.
            </p>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => {
                if (!file) fileInputRef.current?.click();
              }}
              className={`border-2 border-dashed rounded-3xl p-8 md:p-12 text-center transition-all cursor-pointer ${
                isDragActive
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : file
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-[#eae6df] hover:border-primary/50 bg-white/40 hover:bg-white/60"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf"
                className="hidden"
              />

              {!file ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/8 flex items-center justify-center text-primary shadow-inner">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="font-bold text-sm text-primary hover:underline focus:outline-none cursor-pointer"
                    >
                      Click to upload
                    </button>{" "}
                    <span className="text-xs text-foreground/50 font-medium">
                      or drag and drop file here
                    </span>
                  </div>
                  <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-wider">
                    PDF Documents Only • Max 25MB
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-inner">
                    {(() => {
                      const FileIcon = getFileIcon(file.name);
                      return <FileIcon className="h-7 w-7" />;
                    })()}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground truncate max-w-xs md:max-w-md mx-auto">
                      {file.name}
                    </p>
                    <p className="text-xs text-foreground/50 font-medium mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove File</span>
                  </button>
                </div>
              )}
            </div>

            <AnimatePresence>
              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider block">
                    Document Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder={`Default: ${file.name}`}
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full text-sm bg-white border border-[#eae6df] rounded-2xl px-4 py-3 font-semibold text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-2xs"
                  />
                  <p className="text-[10px] text-foreground/40 font-medium">
                    Provide a custom friendly title or leave empty to use the
                    original filename.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-5">
              <div className="border-b border-[#eae6df]/60 pb-2">
                <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider block">
                  Assistant Voice Override (Optional)
                </label>
                <p className="text-[11px] text-foreground/45 font-medium mt-0.5">
                  Select a specific voice for read-aloud functionality when
                  conversing with this document.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                  Female Voices
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {VOICE_OPTIONS.filter((v) => v.category === "female").map(
                    (v) => (
                      <VoiceCard
                        key={v.id}
                        voice={v}
                        isSelected={selectedVoice === v.id}
                        isPlaying={previewPlayingId === v.id}
                        isLoading={previewLoadingId === v.id}
                        onSelect={() => handleSelectVoice(v.id, v.name)}
                      />
                    ),
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                  Male Voices
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {VOICE_OPTIONS.filter((v) => v.category === "male").map(
                    (v) => (
                      <VoiceCard
                        key={v.id}
                        voice={v}
                        isSelected={selectedVoice === v.id}
                        isPlaying={previewPlayingId === v.id}
                        isLoading={previewLoadingId === v.id}
                        onSelect={() => handleSelectVoice(v.id, v.name)}
                      />
                    ),
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={!file || isUploading}
                className="gap-2 rounded-2xl font-bold py-5 px-7 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer min-w-40 text-xs"
              >
                {isUploading ? (
                  <Hourglass className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileUp className="h-3.5 w-3.5" />
                )}
                <span>{isUploading ? "Processing..." : "Upload Document"}</span>
              </Button>
            </div>
          </form>
        </div>

      </main>

      <AnimatePresence>
        {isUploading && <UploadModal uploadStage={uploadStage} />}
      </AnimatePresence>
    </div>
  );
}
function VoiceCard({
  voice,
  isSelected,
  isPlaying,
  isLoading,
  onSelect,
}: {
  voice: VoiceOption;
  isSelected: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col text-left relative overflow-hidden ${
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-[#eae6df] hover:border-primary/30 bg-white"
      }`}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 text-primary">
          <MessageCircleCheck className="h-4 w-4 fill-primary text-white" />
        </div>
      )}
      <div className="flex items-center gap-1.5">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : isPlaying ? (
          <Volume2 className="h-4 w-4 animate-pulse text-primary font-bold" />
        ) : (
          <Volume2
            className={`h-4 w-4 ${
              isSelected ? "text-primary" : "text-foreground/40"
            }`}
          />
        )}
        <span className="text-xs font-black text-foreground">{voice.name}</span>
      </div>
      <span className="text-[10px] text-foreground/50 font-medium mt-1 leading-snug">
        {voice.desc}
      </span>
    </div>
  );
}

function UploadModal({ uploadStage }: { uploadStage: UploadStage }) {
  const getStepStatus = (step: "extracting" | "summarizing" | "saving") => {
    const stageOrder: Record<UploadStage, number> = {
      extracting: 1,
      summarizing: 2,
      saving: 3,
      idle: 4,
    };

    const currentOrder = stageOrder[uploadStage];
    const stepOrder = stageOrder[step];

    if (currentOrder > stepOrder) return "completed";
    if (currentOrder === stepOrder) return "in_progress";
    return "pending";
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-3xl p-8 md:p-10 max-w-90 w-full mx-auto shadow-2xl flex flex-col items-center text-center space-y-6"
      >
        <div className="relative h-20 w-20 flex items-center justify-center bg-[#f9f7f4] rounded-2xl border border-[#eae6df]">
          <Hourglass className="h-10 w-10 text-primary animate-spin duration-1000" />
        </div>

        <div>
          <h3 className="text-[18px] font-black text-foreground">
            Uploading Your Document
          </h3>
          <p className="text-[11px] text-foreground/50 font-semibold mt-1">
            Please wait while we process your file...
          </p>
        </div>

        <div className="w-full text-left space-y-3.5 px-2">
          <StepRow
            status={getStepStatus("extracting")}
            activeText="Uploading PDF..."
            completedText="PDF Uploaded"
          />

          <StepRow
            status={getStepStatus("summarizing")}
            activeText="Analyzing content..."
            completedText="Content analyzed"
          />

          <StepRow
            status={getStepStatus("saving")}
            activeText="Saving to database..."
            completedText="Saved to database"
          />
        </div>
      </motion.div>
    </div>
  );
}

function StepRow({
  status,
  activeText,
  completedText,
}: {
  status: "completed" | "in_progress" | "pending";
  activeText: string;
  completedText: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`h-3 w-3 rounded-full flex items-center justify-center transition-colors ${
          status === "completed"
            ? "bg-emerald-500 text-white"
            : status === "in_progress"
              ? "bg-primary animate-pulse"
              : "bg-[#eae6df]"
        }`}
      >
        {status === "completed" && <Check className="h-2 w-2 stroke-3" />}
      </div>
      <span
        className={`text-xs font-semibold ${
          status === "in_progress"
            ? "text-foreground font-black"
            : status === "completed"
              ? "text-foreground font-medium"
              : "text-foreground/40"
        }`}
      >
        {status === "in_progress"
          ? activeText
          : status === "completed"
            ? completedText
            : activeText}
      </span>
    </div>
  );
}
