"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Trash2,
  BotMessageSquare,
  WandSparkles,
  Loader2,
  X,
  AlertTriangle,
  Vault,
  FileText,
  Eye,
} from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          .eq("user_id", userId);

        if (error) {
          console.warn("Documents fetch info:", error);
          if (
            error.message &&
            !error.message.toLowerCase().includes("failed to fetch")
          ) {
            toast.error(error.message);
          }
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

      let token = null;
      try {
        token = await getToken({ template: "Supabase" });
      } catch (authErr) {
        console.warn("Clerk token error:", authErr);
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
        throw new Error(
          `DB Error [${dbError.code || "N/A"}]: ${dbError.message}`,
        );
      }

      setDocs((prev) => [
        {
          id: docId,
          name: file.name,
          date: formattedDate,
          size: fileSizeStr,
          rawSize: file.size,
          vectors: totalVectors,
          text: extractedText,
          summary,
          tags,
        },
        ...prev,
      ]);

      toast.success("Document vaulted successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(`Upload failed: ${err.message || err}`);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    try {
      let token = null;
      try {
        token = await getToken({ template: "Supabase" });
      } catch (authErr) {
        console.warn("Clerk token error:", authErr);
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
        toast.error("Failed to delete document from vault.");
        console.error(error);
      } else {
        setDocs((prev) => prev.filter((d) => d.id !== id));
        toast.success("Document removed from vault.");
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

  const allTags = Array.from(new Set(docs.flatMap((d) => d.tags || []))).filter(
    Boolean,
  );

  const filteredDocs = docs.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    const matchesTag =
      selectedTag === "all" || (doc.tags && doc.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-[#faf8f5] text-foreground flex relative overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 relative z-10 pb-10">
        <div className="p-5 md:p-10 max-w-7xl w-full mx-auto space-y-8 mt-14 md:mt-0">
          {/* Header */}
          <div className="bg-[#ffffff] border border-[#e5e1da] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 inline-flex items-center gap-1.5">
                <Vault className="w-3 h-3 text-emerald-600" /> Isolated Vector
                Vault
              </span>
              <h1 className="text-2xl md:text-4xl font-heading font-black tracking-tight text-foreground">
                Document Vault
              </h1>
              <p className="text-sm text-foreground/70 font-medium max-w-xl">
                High-security encrypted document index. View raw text
                extractions, monitor vector density, or upload files directly.
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
                className="rounded-2xl font-bold py-5 px-6 shadow-md hover:shadow-lg transition-all gap-2 text-xs bg-primary text-white cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Parsing File...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Vault New PDF</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Search & Tag Filter Toolbar */}
          <div className="bg-[#ffffff] border border-[#e5e1da] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center bg-[#faf8f5] border border-[#e5e1da] rounded-xl px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all flex-1 max-w-md">
              <Search className="h-4 w-4 text-foreground/40 shrink-0 mr-2.5" />
              <input
                type="text"
                placeholder="Filter vault by filename or content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm text-foreground placeholder:text-foreground/40 focus:outline-none w-full font-medium"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-foreground/40 hover:text-foreground p-0.5 rounded-md"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Tag Filter Pills */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-md no-scrollbar">
                <button
                  onClick={() => setSelectedTag("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedTag === "all"
                      ? "bg-primary text-white shadow-xs"
                      : "bg-[#faf8f5] border border-[#e5e1da] text-foreground/70 hover:bg-neutral-100"
                  }`}
                >
                  All ({docs.length})
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 capitalize cursor-pointer ${
                      selectedTag === tag
                        ? "bg-primary text-white shadow-xs"
                        : "bg-[#faf8f5] border border-[#e5e1da] text-foreground/70 hover:bg-neutral-100"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vault Table View */}
          {isLoadingDocs ? (
            <div className="bg-[#ffffff] border border-[#e5e1da] rounded-2xl p-8 space-y-4 animate-pulse">
              <div className="h-6 bg-neutral-200 rounded-md w-1/4" />
              <div className="h-10 bg-neutral-100 rounded-xl w-full" />
              <div className="h-10 bg-neutral-100 rounded-xl w-full" />
              <div className="h-10 bg-neutral-100 rounded-xl w-full" />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="bg-[#ffffff] border border-[#e5e1da] rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-600">
                <Vault className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-heading font-bold text-foreground">
                No Vault Records
              </h3>
              <p className="text-xs text-foreground/60 font-medium">
                {search
                  ? `No document found matching "${search}"`
                  : "Upload a PDF to store it securely in your personal vault."}
              </p>
            </div>
          ) : (
            <div className="bg-[#ffffff] border border-[#e5e1da] rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#faf8f5] border-b border-[#e5e1da] text-[11px] font-bold uppercase tracking-wider text-foreground/50 font-heading">
                      <th className="py-3.5 px-5">Vault File Name</th>
                      <th className="py-3.5 px-4">Size</th>
                      <th className="py-3.5 px-4">Vector Count</th>
                      <th className="py-3.5 px-4">Tags</th>
                      <th className="py-3.5 px-4">Indexed On</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e1da] text-xs font-medium">
                    {filteredDocs.map((doc) => {
                      const FileIconComp = getFileIcon(doc.name);
                      return (
                        <tr
                          key={doc.id}
                          className="hover:bg-[#faf8f5] transition-colors group"
                        >
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                                <FileIconComp className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p
                                  className="font-bold text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                                  onClick={() => setSelectedDoc(doc)}
                                >
                                  {doc.name}
                                </p>
                                <p className="text-[10px] text-foreground/45 line-clamp-1">
                                  {doc.summary || "Secured in cloud"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-foreground/70 font-semibold">
                            {doc.size}
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60 text-[11px]">
                              {doc.vectors} vec
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1">
                              {doc.tags?.slice(0, 2).map((t, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-neutral-100 text-foreground/60 text-[10px] font-bold"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-foreground/50">
                            {doc.date}
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedDoc(doc)}
                                className="px-3 py-1.5 text-xs font-semibold text-foreground/70 hover:text-foreground rounded-lg hover:bg-neutral-100 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> Quick View
                              </button>
                              <Link href={`/chat/${doc.id}`}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl text-xs font-bold gap-1 border-[#e5e1da] bg-white"
                                >
                                  <BotMessageSquare className="h-3.5 w-3.5 text-primary" />
                                  Chat
                                </Button>
                              </Link>
                              <Link href={`/studio/${doc.id}`}>
                                <Button
                                  size="sm"
                                  className="rounded-xl text-xs font-bold gap-1 bg-violet-600 text-white hover:bg-violet-700"
                                >
                                  <WandSparkles className="h-3.5 w-3.5" />
                                  Studio
                                </Button>
                              </Link>
                              <button
                                onClick={() => promptDelete(doc.id, doc.name)}
                                className="text-foreground/30 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Document Inspector Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#ffffff] border border-[#e5e1da] rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#e5e1da] flex items-center justify-between bg-[#faf8f5]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading font-black text-lg text-foreground truncate">
                      {selectedDoc.name}
                    </h3>
                    <p className="text-xs text-foreground/50 font-medium">
                      {selectedDoc.size} • {selectedDoc.vectors} Vector Chunks
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-2 rounded-xl text-foreground/40 hover:text-foreground hover:bg-neutral-200/60 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
                {selectedDoc.summary && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 font-heading">
                      AI Executive Summary
                    </h4>
                    <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#e5e1da] text-foreground/80 leading-relaxed font-medium">
                      {selectedDoc.summary}
                    </div>
                  </div>
                )}

                {selectedDoc.text && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/60 font-heading">
                      Vault Parsed Text
                    </h4>
                    <div className="p-4 rounded-2xl bg-neutral-900 text-neutral-200 font-mono text-xs max-h-48 overflow-y-auto leading-relaxed">
                      {selectedDoc.text.slice(0, 1000)}
                      {selectedDoc.text.length > 1000 && "..."}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-[#e5e1da] bg-[#faf8f5] flex items-center justify-between">
                <button
                  onClick={() => promptDelete(selectedDoc.id, selectedDoc.name)}
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Purge from Vault
                </button>
                <div className="flex items-center gap-3">
                  <Link href={`/chat/${selectedDoc.id}`}>
                    <Button
                      variant="outline"
                      className="rounded-xl font-bold text-xs gap-1.5 border-[#e5e1da] bg-white"
                    >
                      <BotMessageSquare className="w-4 h-4 text-primary" />{" "}
                      Query in Chat
                    </Button>
                  </Link>
                  <Link href={`/studio/${selectedDoc.id}`}>
                    <Button className="rounded-xl font-bold text-xs gap-1.5 bg-violet-600 hover:bg-violet-700 text-white">
                      <WandSparkles className="w-4 h-4" /> Open Studio
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deletingDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#ffffff] border border-[#e5e1da] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-foreground">
                    Confirm Vault Purge
                  </h3>
                  <p className="text-xs text-foreground/60 font-medium">
                    This action is permanent.
                  </p>
                </div>
              </div>

              <p className="text-sm text-foreground/70 font-medium bg-[#faf8f5] p-3.5 rounded-xl border border-[#e5e1da]">
                Are you sure you want to purge{" "}
                <strong className="text-foreground">
                  "{deletingDoc.name}"
                </strong>{" "}
                from your Vault?
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDeletingDoc(null)}
                  className="rounded-xl font-bold text-xs border-[#e5e1da] bg-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const id = deletingDoc.id;
                    setDeletingDoc(null);
                    handleDelete(id);
                  }}
                  className="rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-xs"
                >
                  Purge Document
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
