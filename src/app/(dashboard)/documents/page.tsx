"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, BotMessageSquare, Loader2, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/Sidebar";
import { motion, AnimatePresence } from "motion/react";
import { extractTextFromFile } from "@/lib/document/pdfParser";
import { useAuth } from "@clerk/nextjs";
import { getSupabaseClient } from "@/lib/db/supabase";
import { toast } from "sonner";
import { getFileIcon } from "@/lib/helpers/utils";

interface Document {
  id: string;
  name: string;
  date: string;
  size: string;
  vectors: number;
  rawSize: number;
  text?: string;
  summary?: string;
  tags?: string[];
}

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

export default function DocumentsPage() {
  const { userId, isLoaded, getToken } = useAuth();
  const [docs, setDocs] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  useEffect(() => {
    if (!isLoaded || !userId) return;

    const fetchDocuments = async () => {
      setIsLoadingDocs(true);
      try {
        let token = null;
        try {
          token = await getToken({ template: "Supabase" });
        } catch (authErr) {
          console.warn("Clerk Supabase JWT template not found:", authErr);
        }

        const supabaseClient = getSupabaseClient(token || "");
        const { data, error } = await supabaseClient
          .from("documents")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Failed to load documents:", error);
          toast.error("Failed to load document library.");
        } else if (data) {
          setDocs(
            data.map((d: any) => ({
              id: d.id,
              name: d.name,
              date: d.date,
              size: d.size,
              vectors: d.vectors,
              rawSize: d.raw_size,
              text: d.text,
              summary: d.summary,
              tags: d.tags,
            })),
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingDocs(false);
      }
    };

    fetchDocuments();
  }, [userId, isLoaded]);

  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<{ id: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      toast.error("Only PDF files are supported currently.");
      return;
    }

    setIsUploading(true);

    try {
      const extractedText = await extractTextFromFile(file);

      let summary = "Summary generation failed or not available.";
      let tags = ["General"];

      try {
        const sumResp = await fetch("/api/summarize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentName: file.name,
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

      const docId = generateCustomID();
      const fileSizeStr = file.size > 1024 * 1024 
        ? (file.size / (1024 * 1024)).toFixed(1) + " MB" 
        : (file.size / 1024).toFixed(0) + " KB";
      const totalVectors = Math.floor(file.size / 1350) + 42;
      const formattedDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      let token = null;
      try {
        token = await getToken({ template: "Supabase" });
      } catch (authErr) {
        console.warn("Clerk Supabase token fetch failed:", authErr);
      }

      const supabaseClient = getSupabaseClient(token || "");
      const { error: dbError } = await supabaseClient.from("documents").insert({
        id: docId,
        user_id: userId,
        name: file.name,
        date: formattedDate,
        size: fileSizeStr,
        raw_size: file.size,
        vectors: totalVectors,
        text: extractedText,
        summary,
        tags,
      });

      if (dbError) {
        throw new Error(dbError.message);
      }

      const newDoc: Document = {
        id: docId,
        name: file.name,
        date: formattedDate,
        size: fileSizeStr,
        vectors: totalVectors,
        rawSize: file.size,
        text: extractedText,
        summary,
        tags,
      };

      setDocs((prev) => [newDoc, ...prev]);
      toast.success("Document uploaded successfully!");
    } catch (err: any) {
      console.error("Failed to parse or save file:", err);
      toast.error(`Upload failed: ${err.message || err}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    try {
      let token = null;
      try {
        token = await getToken({ template: "Supabase" });
      } catch (authErr) {
        console.warn("Clerk token failed:", authErr);
      }
      const supabaseClient = getSupabaseClient(token || "");

      await supabaseClient
        .from("chats")
        .delete()
        .eq("document_id", id)
        .eq("user_id", userId);

      const { error } = await supabaseClient
        .from("documents")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        toast.error("Failed to delete document from cloud.", { position: "top-center" });
        console.error(error);
      } else {
        setDocs((prev) => prev.filter((d) => d.id !== id));
        toast.success("Document deleted successfully.", { position: "top-center" });
        if (selectedDoc?.id === id) {
          setSelectedDoc(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const promptDelete = (id: string, name: string) => {
    setDeletingDoc({ id, name });
  };

  const filteredDocs = docs.filter((doc) => 
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f9f7f4] flex relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-125 h-125 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-150 h-150 rounded-full bg-violet-400/4 blur-[130px] pointer-events-none" />

      <Sidebar />

      <main className="flex-1 flex flex-col overflow-auto min-w-0 relative z-10">
        <div className="p-4 md:p-8 max-w-6xl w-full mx-auto space-y-8 md:space-y-10 mt-14 md:mt-0">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-[#eae6df]/60 pb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-black text-foreground leading-tight tracking-tight">
                Documents Vault
              </h1>
              <p className="text-sm text-foreground/50 font-medium mt-1.5">
                Manage, search, and upload files to your isolated semantic indexing system.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".pdf"
                className="hidden" 
              />
              <Button 
                onClick={handleUploadClick} 
                disabled={isUploading}
                className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 rounded-xl md:rounded-2xl cursor-pointer disabled:opacity-55 py-5 px-5 font-semibold text-sm"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4.5 w-4.5" />
                )}
                <span>{isUploading ? "Uploading..." : "Upload Document"}</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center bg-white/70 backdrop-blur-md border border-[#eae6df] rounded-xl md:rounded-2xl px-4 py-2.5 md:py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all max-w-md shadow-sm">
            <Search className="h-4 w-4 text-foreground/35 shrink-0" />
            <input 
              type="text" 
              placeholder="Search documents by filename..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-3 bg-transparent text-sm focus:outline-none w-full text-foreground placeholder:text-foreground/35 font-medium"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white border border-[#eae6df] rounded-2xl md:rounded-3xl shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#eae6df]/60 bg-white/30 backdrop-blur-sm">
              <h2 className="font-heading font-bold text-base md:text-lg text-foreground">All Uploaded Files</h2>
              <span className="text-xs font-bold text-primary bg-primary/8 px-2.5 py-1 rounded-xl">
                {filteredDocs.length} files
              </span>
            </div>

            <div className="divide-y divide-[#eae6df]/50">
              <AnimatePresence initial={false}>
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between px-6 py-4 hover:bg-[#f3efeb]/35 transition-colors group cursor-pointer"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0 shadow-sm">
                          {(() => {
                            const FileIcon = getFileIcon(doc.name);
                            return <FileIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />;
                          })()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-foreground truncate max-w-35 xs:max-w-[200px] sm:max-w-md group-hover:text-primary transition-colors duration-200">
                            {doc.name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-foreground/45 mt-0.5">
                            Uploaded {doc.date} <span className="hidden sm:inline-block mx-1.5">•</span> <span className="hidden sm:inline-block">{doc.vectors.toLocaleString()} vectors</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                        <span className="text-[10px] sm:text-xs font-semibold text-foreground/40 px-2 py-1 bg-[#eae6df]/40 rounded-lg hidden md:block">{doc.size}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            promptDelete(doc.id, doc.name);
                          }}
                          className="text-foreground/25 hover:text-destructive p-1.5 sm:p-2 hover:bg-destructive/5 rounded-xl transition-all cursor-pointer"
                          title="Delete document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-12 text-center text-foreground/40 text-sm">
                    No documents found. Upload a PDF to get started!
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>

      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDoc(null)}
              className="absolute inset-0 bg-black/30 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 150 }}
              className="relative w-full max-w-md md:max-w-lg bg-white border-l border-[#eae6df] h-full shadow-2xl flex flex-col z-10"
            >
              <div className="p-6 border-b border-[#eae6df] flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center text-primary shadow-sm shrink-0">
                    {(() => {
                      const SelectedFileIcon = getFileIcon(selectedDoc.name);
                      return <SelectedFileIcon className="h-5 w-5" />;
                    })()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading font-black text-foreground text-base truncate max-w-60 md:max-w-xs">
                      {selectedDoc.name}
                    </h3>
                    <p className="text-[10px] text-foreground/45 font-semibold mt-0.5 uppercase tracking-wider">
                      Document Insights
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 rounded-xl hover:bg-black/5 text-foreground/45 hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5 cursor-pointer" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-[#f9f7f4] border border-[#eae6df]/60">
                    <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-wider block">File Size</span>
                    <span className="text-sm font-bold text-foreground block mt-1">{selectedDoc.size}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f9f7f4] border border-[#eae6df]/60">
                    <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-wider block">Vectors Indexed</span>
                    <span className="text-sm font-bold text-foreground block mt-1">{selectedDoc.vectors.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground/50 uppercase tracking-wider">AI Classifications</h4>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {selectedDoc.tags && selectedDoc.tags.length > 0 ? (
                      selectedDoc.tags.map((tag, idx) => (
                        <span key={idx} className="text-[10px] md:text-xs font-bold text-primary bg-primary/8 border border-primary/10 px-2.5 py-1 rounded-xl shadow-2xs">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] md:text-xs font-bold text-foreground/45 bg-zinc-100 px-2.5 py-1 rounded-xl">
                        Uncategorized
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Executive Summary</h4>
                  <div className="p-5 rounded-2xl bg-primary/4 border border-primary/10 text-sm text-foreground/85 leading-relaxed font-semibold shadow-2xs">
                    {selectedDoc.summary || "No summary available for this file."}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-[#eae6df] bg-zinc-50/50 flex gap-3">
                <Link href={`/chat?id=${encodeURIComponent(selectedDoc.id)}`} className="flex-1" onClick={() => setSelectedDoc(null)}>
                  <Button className="w-full rounded-xl py-5 text-sm font-bold shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 cursor-pointer">
                    <BotMessageSquare className="h-4 w-4" />
                    Open in Chat
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    promptDelete(selectedDoc.id, selectedDoc.name);
                    setSelectedDoc(null);
                  }}
                  className="rounded-xl border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 px-4 shrink-0 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-[#eae6df] rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-6 relative overflow-hidden"
            >
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600 shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <h4 className="font-heading font-black text-base text-foreground">Confirm Deletion</h4>
                  <p className="text-xs font-semibold text-foreground/50 leading-relaxed wrap-break-word">
                    Are you sure you want to permanently delete <span className="font-black text-foreground">"{deletingDoc.name}"</span>? This will erase all vectorized data and chat history.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    handleDelete(deletingDoc.id);
                    setDeletingDoc(null);
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-red-500/10 active:scale-95 text-center"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setDeletingDoc(null)}
                  className="flex-1 px-4 py-3 bg-white border border-[#eae6df] hover:bg-slate-50 text-foreground rounded-2xl text-xs font-bold transition-all cursor-pointer active:scale-95 text-center"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
