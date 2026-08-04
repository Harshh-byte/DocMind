"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  TrendingUp,
  HardDrive,
  Trash2,
  X,
  Files,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  Sparkles,
  BotMessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/Sidebar";
import { motion, AnimatePresence } from "motion/react";
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

export default function DashboardPage() {
  const { userId, isLoaded, getToken } = useAuth();
  const [docs, setDocs] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<{ id: string; name: string } | null>(null);

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
  }, [userId, isLoaded, getToken]);

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
        toast.error("Failed to delete document from cloud.", {
          position: "top-center",
        });
        console.error(error);
      } else {
        setDocs((prev) => prev.filter((d) => d.id !== id));
        toast.custom(
          () => (
            <div className="bg-white/95 backdrop-blur-md border border-[#eae6df] p-4 rounded-2xl shadow-xl flex items-center gap-3 w-80 max-w-sm">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">Deleted</p>
                <p className="text-[10px] text-foreground/50 mt-0.5 leading-snug">
                  Document and associated memory removed.
                </p>
              </div>
            </div>
          ),
          { position: "top-center", duration: 3000 },
        );
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

  const totalDocs = docs.length;
  const totalVectors = docs.reduce((sum, d) => sum + d.vectors, 0);
  const totalBytes = docs.reduce((sum, d) => sum + (d.rawSize || 0), 0);
  const totalStorage =
    totalBytes > 1024 * 1024
      ? (totalBytes / (1024 * 1024)).toFixed(1) + " MB"
      : (totalBytes / 1024).toFixed(0) + " KB";

  const filteredDocs = docs.filter((doc) =>
    doc.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#f9f7f4] flex relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-125 h-125rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-150 h-150 rounded-full bg-violet-400/4 blur-[130px] pointer-events-none" />

      <Sidebar />

      <main className="flex-1 flex flex-col overflow-auto min-w-0 relative z-10">
        <div className="p-4 md:p-8 max-w-5xl w-full mx-auto space-y-8 md:space-y-10 mt-14 md:mt-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#eae6df]/60 pb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-black leading-tight tracking-tight">
                <span className="shiny-text animate-shine text-violet-600">
                  Document Library
                </span>
              </h1>
              <p className="text-xs md:text-sm text-foreground/70 font-medium mt-1.5">
                Manage your vectors, read executive AI summaries, or query
                documents in real time.
              </p>
            </div>

            <Link href="/upload">
              <Button className="rounded-2xl font-bold py-5 px-5 shadow-lg shadow-primary/15 hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2 text-xs cursor-pointer">
                <PlusCircle className="h-4 w-4" />
                <span>Upload New</span>
              </Button>
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {[
              {
                label: "Total Documents",
                value: isLoadingDocs ? "—" : totalDocs.toString(),
                icon: Files,
                color: "text-primary",
                bg: "bg-primary/8",
              },
              {
                label: "Vectors Indexed",
                value: isLoadingDocs ? "—" : totalVectors.toLocaleString(),
                icon: TrendingUp,
                color: "text-emerald-600",
                bg: "bg-emerald-500/8",
              },
              {
                label: "Storage Used",
                value: isLoadingDocs ? "—" : totalStorage,
                icon: HardDrive,
                color: "text-amber-600",
                bg: "bg-amber-500/8",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/70 backdrop-blur-md border border-[#eae6df] rounded-2xl p-5 flex items-center gap-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div
                  className={`h-11 w-11 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-foreground/45 font-bold truncate">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-heading font-black text-foreground mt-0.5">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>

          <div className="flex items-center bg-white/80 backdrop-blur-md border border-[#eae6df] rounded-2xl px-4 py-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 transition-all max-w-md shadow-xs">
            <Search className="h-4 w-4 text-foreground/40 shrink-0" />
            <input
              type="text"
              placeholder="Filter library by file name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-3 bg-transparent text-xs md:text-sm focus:outline-none w-full text-foreground placeholder:text-foreground/35 font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="p-1 hover:bg-black/5 rounded-lg text-foreground/40 hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white border border-[#eae6df] rounded-3xl shadow-xs overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#eae6df]/60 bg-white/40 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-sm md:text-base text-foreground">
                  Knowledge Repository
                </h2>
              </div>
              <span className="text-[11px] font-bold text-primary bg-primary/8 px-3 py-1 rounded-full">
                {filteredDocs.length}{" "}
                {filteredDocs.length === 1 ? "file" : "files"}
              </span>
            </div>

            <div className="divide-y divide-[#eae6df]/50">
              {isLoadingDocs ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-6 flex items-center justify-between animate-pulse gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-10 w-10 bg-black/5 rounded-xl shrink-0" />
                      <div className="space-y-2 flex-1 max-w-xs">
                        <div className="h-3.5 bg-black/5 rounded-md w-3/4" />
                        <div className="h-2.5 bg-black/5 rounded-md w-1/2" />
                      </div>
                    </div>
                    <div className="h-8 w-20 bg-black/5 rounded-xl shrink-0" />
                  </div>
                ))
              ) : filteredDocs.length > 0 ? (
                <AnimatePresence initial={false}>
                  {filteredDocs.map((doc) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between px-6 py-4 hover:bg-[#f3efeb]/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0 shadow-xs">
                          {(() => {
                            const FileIcon = getFileIcon(doc.name);
                            return <FileIcon className="h-5 w-5" />;
                          })()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-foreground truncate max-w-45 xs:max-w-[240px] sm:max-w-md group-hover:text-primary transition-colors duration-200">
                            {doc.name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-foreground/45 mt-0.5 font-medium">
                            {doc.date}{" "}
                            <span className="hidden sm:inline-block mx-1 text-foreground/20">
                              •
                            </span>{" "}
                            <span className="hidden sm:inline-block text-foreground/50">
                              {doc.vectors.toLocaleString()} vectors
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <Link
                          href={`/chat?id=${encodeURIComponent(doc.id)}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs font-bold rounded-xl border-[#eae6df] hover:border-primary/40 hover:bg-primary hover:text-white px-3 py-2 cursor-pointer shadow-2xs transition-all duration-200 gap-1.5"
                          >
                            <BotMessageSquare className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Ask AI</span>
                          </Button>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            promptDelete(doc.id, doc.name);
                          }}
                          className="text-foreground/25 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                          title="Delete document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                /* Empty State */
                <div className="py-16 px-4 text-center space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mx-auto">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      No documents found
                    </h3>
                    <p className="text-xs text-foreground/50 mt-1 max-w-xs mx-auto font-medium">
                      {search
                        ? "No document titles match your search criteria."
                        : "Upload your first document to start indexing vectors."}
                    </p>
                  </div>
                </div>
              )}
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
              transition={{ type: "spring", damping: 22, stiffness: 180 }}
              className="relative w-full max-w-md md:max-w-lg bg-white border-l border-[#eae6df] h-full shadow-2xl flex flex-col z-10"
            >
              <div className="p-6 border-b border-[#eae6df] flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-xs shrink-0">
                    {(() => {
                      const SelectedFileIcon = getFileIcon(selectedDoc.name);
                      return <SelectedFileIcon className="h-5 w-5" />;
                    })()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading font-black text-foreground text-sm md:text-base truncate">
                      {selectedDoc.name}
                    </h3>
                    <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider mt-0.5">
                      Document Insights
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 rounded-xl hover:bg-black/5 text-foreground/40 hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-[#f9f7f4] border border-[#eae6df]/60">
                    <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-wider block">
                      File Size
                    </span>
                    <span className="text-xs md:text-sm font-bold text-foreground block mt-1">
                      {selectedDoc.size}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f9f7f4] border border-[#eae6df]/60">
                    <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-wider block">
                      Vectors Indexed
                    </span>
                    <span className="text-xs md:text-sm font-bold text-foreground block mt-1">
                      {selectedDoc.vectors.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider">
                    Classifications
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoc.tags && selectedDoc.tags.length > 0 ? (
                      selectedDoc.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] md:text-xs font-bold text-primary bg-primary/8 border border-primary/10 px-2.5 py-1 rounded-xl"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] md:text-xs font-bold text-foreground/40 bg-zinc-100 px-2.5 py-1 rounded-xl">
                        General
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider">
                    Executive Summary
                  </h4>
                  <div className="p-5 rounded-2xl bg-primary/4 border border-primary/10 text-xs md:text-sm text-foreground/80 leading-relaxed font-medium shadow-2xs">
                    {selectedDoc.summary ||
                      "No summary available for this file."}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-[#eae6df] bg-zinc-50/50 flex gap-3">
                <Link
                  href={`/chat?id=${encodeURIComponent(selectedDoc.id)}`}
                  className="flex-1"
                  onClick={() => setSelectedDoc(null)}
                >
                  <Button className="w-full rounded-xl py-5 text-xs md:text-sm font-bold shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer">
                    <BotMessageSquare className="h-4 w-4" />
                    <span>Open in Chat</span>
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
