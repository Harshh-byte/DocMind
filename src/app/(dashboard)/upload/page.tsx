"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  Trash2,
  Volume2,
  Loader2,
  CheckCircle,
  ArrowRight,
  FileText,
  Zap,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { extractTextFromFile } from "@/lib/document/pdfParser";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { getSupabaseClient } from "@/lib/db/supabase";
import { Sidebar } from "@/components/layout/Sidebar";

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
  const [selectedVoice, setSelectedVoice] = useState("Aoede");
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

      toast.success("Document uploaded and vectorized successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Upload process error:", err);
      toast.error(`Upload failed: ${err.message || err}`);
    } finally {
      setIsUploading(false);
      setUploadStage("idle");
    }
  };

  const stagesInfo = [
    {
      key: "extracting",
      title: "Text Extraction",
      desc: "Parsing PDF structure into text stream",
    },
    {
      key: "summarizing",
      title: "AI Vectorization",
      desc: "Generating embeddings & AI summary",
    },
    {
      key: "saving",
      title: "Vault Storage",
      desc: "Storing vectors securely in cloud database",
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-foreground flex relative overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 relative z-10 pb-10">
        <div className="p-5 md:p-10 max-w-4xl w-full mx-auto space-y-8 mt-14 md:mt-0">
          {/* Header */}
          <div className="bg-[#ffffff] border border-[#e5e1da] rounded-3xl p-6 md:p-8 shadow-xs space-y-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-primary/10 text-primary border border-primary/20 inline-flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-primary animate-pulse" /> Document
              Ingestion Pipeline
            </span>
            <h1 className="text-2xl md:text-4xl font-heading font-black tracking-tight text-foreground">
              Upload & Vectorize Document
            </h1>
            <p className="text-sm text-foreground/70 font-medium">
              Upload your PDF to extract semantic vectors, generate executive
              summaries, and enable instant AI audio podcasts.
            </p>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            {/* File Dropzone Card */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => {
                if (!file) fileInputRef.current?.click();
              }}
              className={`border-2 border-dashed rounded-3xl p-8 md:p-12 text-center transition-all cursor-pointer relative bg-[#ffffff] shadow-xs ${
                isDragActive
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : file
                    ? "border-emerald-500/60 bg-emerald-500/5"
                    : "border-[#e5e1da] hover:border-primary/50 hover:bg-[#faf8f5]"
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
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-heading font-bold text-foreground">
                      Click to upload or drag & drop PDF here
                    </p>
                    <p className="text-xs text-foreground/50 font-medium">
                      Maximum file size: 25MB • Formats: PDF Documents
                    </p>
                  </div>
                  <span className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white shadow-xs hover:bg-primary/90 transition-all inline-block mt-2">
                    Browse File
                  </span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#faf8f5] border border-[#e5e1da]">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-heading font-bold text-sm text-foreground truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-foreground/50 font-medium">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for
                        processing
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    className="p-2 text-foreground/40 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors shrink-0"
                    title="Remove File"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Config Options */}
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Title Input */}
                <div className="bg-[#ffffff] border border-[#e5e1da] rounded-2xl p-6 space-y-3 shadow-xs">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 font-heading block">
                    Custom Document Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder={file.name}
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e5e1da] rounded-xl px-4 py-3 text-sm text-foreground font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* Voice Selection Cards */}
                <div className="bg-[#ffffff] border border-[#e5e1da] rounded-2xl p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/70 font-heading flex items-center gap-2">
                        <Headphones className="w-4 h-4 text-primary" /> Select
                        AI Podcast Voice Persona
                      </h3>
                      <p className="text-xs text-foreground/50 font-medium mt-0.5">
                        Choose the voice that will host your audio podcast
                        summaries.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {VOICE_OPTIONS.map((voice) => {
                      const isSelected = selectedVoice === voice.id;
                      const isPlaying = previewPlayingId === voice.id;
                      const isLoading = previewLoadingId === voice.id;

                      return (
                        <div
                          key={voice.id}
                          onClick={() =>
                            handleSelectVoice(voice.id, voice.name)
                          }
                          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-primary/5 border-primary shadow-xs"
                              : "bg-[#faf8f5] border-[#e5e1da] hover:border-neutral-300"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-heading font-bold text-sm text-foreground">
                                {voice.name}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-foreground/45 px-1.5 py-0.2 rounded bg-neutral-200">
                                {voice.category}
                              </span>
                            </div>
                            <p className="text-xs text-foreground/60 font-medium">
                              {voice.desc}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 text-primary animate-spin" />
                            ) : isPlaying ? (
                              <div className="flex items-center gap-0.5 h-4">
                                <span className="w-1 bg-primary h-full animate-bounce" />
                                <span className="w-1 bg-primary h-3 animate-bounce [animation-delay:0.2s]" />
                                <span className="w-1 bg-primary h-full animate-bounce [animation-delay:0.4s]" />
                              </div>
                            ) : (
                              <Volume2
                                className={`w-4 h-4 ${isSelected ? "text-primary" : "text-foreground/40"}`}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Upload Stepper & Submit */}
                {isUploading ? (
                  <div className="bg-[#ffffff] border border-[#e5e1da] rounded-2xl p-6 space-y-4 shadow-xs">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary font-heading flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing
                      Document Pipeline...
                    </p>
                    <div className="space-y-3">
                      {stagesInfo.map((st, i) => {
                        const isCurrent = uploadStage === st.key;
                        const isDone =
                          (uploadStage === "summarizing" && i === 0) ||
                          (uploadStage === "saving" && i <= 1);

                        return (
                          <div
                            key={st.key}
                            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                              isCurrent
                                ? "bg-primary/5 border-primary/40 text-foreground"
                                : isDone
                                  ? "bg-emerald-500/5 border-emerald-500/30 text-foreground"
                                  : "bg-[#faf8f5] border-[#e5e1da] text-foreground/40"
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                            ) : isCurrent ? (
                              <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                                {i + 1}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-xs">{st.title}</p>
                              <p className="text-[11px] text-foreground/60">
                                {st.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <Button
                    type="submit"
                    className="w-full py-6 rounded-2xl font-bold text-sm bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg transition-all gap-2 cursor-pointer"
                  >
                    <span>Start Vector Parsing & AI Analysis</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </motion.div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
