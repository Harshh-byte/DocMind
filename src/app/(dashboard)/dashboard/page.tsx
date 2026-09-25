"use client";

import { useState, useEffect } from "react";
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
  BotMessageSquare,
  WandSparkles,
  Eye,
  Grid,
  List as ListIcon,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/Sidebar";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, useUser } from "@clerk/nextjs";
import { getSupabaseClient } from "@/lib/db/supabase";
import { toast } from "sonner";
import { getFileIcon } from "@/lib/helpers/utils";
import { CountUp } from "@/components/ui/CountUp";

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
  const { user } = useUser();
  const [docs, setDocs] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<{
    id: string;
    name: string;
  } | null>(null);

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
          if (error.message && !error.message.toLowerCase().includes("failed to fetch")) {
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
        toast.error("Failed to delete document from cloud.");
        console.error(error);
      } else {
        setDocs((prev) => prev.filter((d) => d.id !== id));
        toast.custom(
          () => (
            <div className="bg-[#ffffff] border border-[#e5e1da] p-4 rounded-2xl shadow-xl flex items-center gap-3 w-80 max-w-sm text-foreground">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">
                  Document Removed
                </p>
                <p className="text-[10px] text-foreground/60 mt-0.5 leading-snug">
                  Vectors and chat history deleted cleanly.
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

  // Derive unique tags
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

      <main className="flex-1 flex flex-col overflow-y-auto max-h-screen min-w-0 relative z-10">
        <div className="p-5 md:p-10 max-w-7xl w-full mx-auto space-y-8 mt-14 md:mt-0">
          {/* Top Hero Banner */}
          <div className="bg-linear-to-r from-primary/10 via-violet-500/5 to-amber-500/5 border border-primary/15 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-[0_4px_25px_rgba(79,70,229,0.05)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <h1 className="text-2xl md:text-4xl font-heading font-black tracking-tight text-foreground">
                  {"Welcome"},{" "}
                  <span className="bg-linear-to-r from-primary to-violet-600 bg-clip-text text-transparent">
                    {user?.firstName || "Scholar"}
                  </span>
                </h1>
                <p className="text-sm text-foreground/70 font-medium max-w-xl">
                  Transform static documents into active AI synthesis partners.
                  Explore vectors, listen to podcasts, or initiate chat.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link href="/upload">
                  <Button className="rounded-2xl font-bold py-5 px-6 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all gap-2 text-xs cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90">
                    <PlusCircle className="h-4 w-4" />
                    <span>Upload & Parse</span>
                  </Button>
                </Link>
                <Link href="/chat">
                  <Button
                    variant="outline"
                    className="rounded-2xl font-bold py-5 px-5 border-[#e5e1da] bg-white text-foreground hover:bg-neutral-50 shadow-xs hover:scale-[1.02] transition-all gap-2 text-xs"
                  >
                    <BotMessageSquare className="h-4 w-4 text-primary" />
                    <span>Chat Hub</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Key Metrics Overview Cards */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              {
                label: "Total Documents",
                valNum: totalDocs,
                suffix: "",
                icon: Files,
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                label: "Vector Embeddings",
                valNum: totalVectors,
                suffix: "",
                icon: TrendingUp,
                color: "text-emerald-600",
                bg: "bg-emerald-500/10",
              },
              {
                label: "Storage Occupied",
                valNum:
                  totalBytes > 1024 * 1024
                    ? parseFloat((totalBytes / (1024 * 1024)).toFixed(1))
                    : parseFloat((totalBytes / 1024).toFixed(0)),
                suffix: totalBytes > 1024 * 1024 ? " MB" : " KB",
                icon: HardDrive,
                color: "text-amber-600",
                bg: "bg-amber-500/10",
              },
              {
                label: "AI Studio Suites",
                valNum: totalDocs > 0 ? totalDocs * 3 : 0,
                suffix: " Assets",
                icon: WandSparkles,
                color: "text-violet-600",
                bg: "bg-violet-500/10",
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-[#ffffff] border border-[#e5e1da] rounded-2xl p-5 flex flex-col justify-between shadow-[0_2px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(79,70,229,0.08)] hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-foreground/50 font-bold font-heading">
                    {stat.label}
                  </span>
                  <div
                    className={`h-9 w-9 rounded-xl ${stat.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl md:text-3xl font-heading font-black text-foreground tracking-tight flex items-baseline gap-1">
                    {isLoadingDocs ? (
                      "—"
                    ) : (
                      <>
                        <CountUp to={stat.valNum} duration={1.2} />
                        <span className="text-sm font-semibold text-foreground/60">
                          {stat.suffix}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Search, Filter Bar & View Toggle */}
          <div className="bg-[#ffffff] border border-[#e5e1da] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="flex items-center bg-[#faf8f5] border border-[#e5e1da] rounded-xl px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all flex-1 max-w-lg">
              <Search className="h-4 w-4 text-foreground/40 shrink-0 mr-2.5" />
              <input
                type="text"
                placeholder="Search documents by filename or tag..."
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

            {/* Filter Pills & View Mode Switcher */}
            <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
              {/* Category Filter Pills */}
              {allTags.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-xs sm:max-w-md no-scrollbar">
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

              {/* Grid / Table Toggle */}
              <div className="flex items-center bg-[#faf8f5] border border-[#e5e1da] rounded-xl p-1 shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-primary shadow-xs font-bold"
                      : "text-foreground/40 hover:text-foreground"
                  }`}
                  title="Grid View"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "table"
                      ? "bg-white text-primary shadow-xs font-bold"
                      : "text-foreground/40 hover:text-foreground"
                  }`}
                  title="List View"
                >
                  <ListIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Document Section Content */}
          {isLoadingDocs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-48 rounded-2xl bg-white border border-[#e5e1da] p-5 animate-pulse flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-200" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-neutral-200 rounded-md w-3/4" />
                      <div className="h-3 bg-neutral-200 rounded-md w-1/2" />
                    </div>
                  </div>
                  <div className="h-8 bg-neutral-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#ffffff] border border-[#e5e1da] rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                <Files className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-heading font-bold text-foreground">
                  {search
                    ? "No matching documents found"
                    : "Your Library is Empty"}
                </h3>
                <p className="text-xs text-foreground/60 font-medium">
                  {search
                    ? `No document matched "${search}". Try searching another keyword or clear filters.`
                    : "Upload your first PDF, TXT, or DOC file to generate AI vector embeddings and audio podcasts."}
                </p>
              </div>
              {!search && (
                <Link href="/upload" className="inline-block pt-2">
                  <Button className="rounded-xl font-bold px-6 py-5 gap-2 bg-primary text-white shadow-md hover:bg-primary/90">
                    <PlusCircle className="w-4 h-4" />
                    Upload Document
                  </Button>
                </Link>
              )}
            </motion.div>
          ) : viewMode === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {filteredDocs.map((doc) => {
                  const FileIconComp = getFileIcon(doc.name);
                  return (
                    <motion.div
                      key={doc.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="bg-[#ffffff] border border-[#e5e1da] rounded-2xl p-5 flex flex-col justify-between shadow-[0_2px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(79,70,229,0.08)] hover:-translate-y-1 transition-all duration-300 relative group"
                    >
                      {/* Card Top */}
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                              <FileIconComp className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3
                                className="font-heading font-bold text-sm text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                                title={doc.name}
                                onClick={() => setSelectedDoc(doc)}
                              >
                                {doc.name}
                              </h3>
                              <p className="text-[11px] text-foreground/50 font-medium flex items-center gap-2 mt-0.5">
                                <span>{doc.size}</span>
                                <span>•</span>
                                <span className="text-emerald-600 font-semibold">
                                  {doc.vectors} vectors
                                </span>
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => promptDelete(doc.id, doc.name)}
                            className="text-foreground/30 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                            title="Delete document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Summary / Snippet */}
                        {doc.summary ? (
                          <p className="text-xs text-foreground/65 line-clamp-2 leading-relaxed bg-[#faf8f5] p-2.5 rounded-xl border border-[#e5e1da]">
                            {doc.summary}
                          </p>
                        ) : (
                          <p className="text-xs text-foreground/45 italic bg-[#faf8f5] p-2.5 rounded-xl border border-[#e5e1da]">
                            Parsed text with vector chunks ready for synthesis.
                          </p>
                        )}

                        {/* Tags */}
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {doc.tags.map((t, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-neutral-100 text-foreground/60 border border-neutral-200/80 capitalize"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Bottom Actions */}
                      <div className="pt-4 mt-4 border-t border-[#e5e1da] flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="px-3 py-1.5 text-xs font-semibold text-foreground/70 hover:text-foreground flex items-center gap-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Inspect
                        </button>

                        <div className="flex items-center gap-1.5">
                          <Link href={`/chat/${doc.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl text-xs font-bold gap-1 border-[#e5e1da] hover:border-primary/40 hover:text-primary bg-white"
                            >
                              <BotMessageSquare className="h-3.5 w-3.5 text-primary" />
                              Chat
                            </Button>
                          </Link>
                          <Link href={`/studio/${doc.id}`}>
                            <Button
                              size="sm"
                              className="rounded-xl text-xs font-bold gap-1 bg-violet-600 text-white hover:bg-violet-700 shadow-xs"
                            >
                              <WandSparkles className="h-3.5 w-3.5" />
                              Studio
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            /* Table View */
            <div className="bg-[#ffffff] border border-[#e5e1da] rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#faf8f5] border-b border-[#e5e1da] text-[11px] font-bold uppercase tracking-wider text-foreground/50 font-heading">
                      <th className="py-3.5 px-5">Document Name</th>
                      <th className="py-3.5 px-4">Size</th>
                      <th className="py-3.5 px-4">Vectors</th>
                      <th className="py-3.5 px-4">Date Uploaded</th>
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
                              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
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
                                  {doc.summary || "Ready for query"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-foreground/70 font-semibold">
                            {doc.size}
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60 text-[11px]">
                              {doc.vectors} vec
                            </span>
                          </td>
                          <td className="py-4 px-4 text-foreground/50">
                            {doc.date}
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
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

      {/* Quick Inspection Drawer / Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#ffffff] border border-[#e5e1da] rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#e5e1da] flex items-center justify-between bg-[#faf8f5]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading font-black text-lg text-foreground truncate">
                      {selectedDoc.name}
                    </h3>
                    <p className="text-xs text-foreground/50 font-medium">
                      {selectedDoc.size} • {selectedDoc.vectors} Vector
                      Embeddings
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

              {/* Modal Content Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
                {selectedDoc.summary && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary font-heading flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Executive Summary
                    </h4>
                    <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#e5e1da] text-foreground/80 leading-relaxed font-medium">
                      {selectedDoc.summary}
                    </div>
                  </div>
                )}

                {selectedDoc.text && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/60 font-heading">
                      Extracted Text Preview
                    </h4>
                    <div className="p-4 rounded-2xl bg-neutral-900 text-neutral-200 font-mono text-xs max-h-48 overflow-y-auto leading-relaxed">
                      {selectedDoc.text.slice(0, 1000)}
                      {selectedDoc.text.length > 1000 && "..."}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-5 border-t border-[#e5e1da] bg-[#faf8f5] flex items-center justify-between">
                <button
                  onClick={() => promptDelete(selectedDoc.id, selectedDoc.name)}
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Delete Document
                </button>
                <div className="flex items-center gap-3">
                  <Link href={`/chat/${selectedDoc.id}`}>
                    <Button
                      variant="outline"
                      className="rounded-xl font-bold text-xs gap-1.5 border-[#e5e1da] bg-white"
                    >
                      <BotMessageSquare className="w-4 h-4 text-primary" />{" "}
                      Start Chat
                    </Button>
                  </Link>
                  <Link href={`/studio/${selectedDoc.id}`}>
                    <Button className="rounded-xl font-bold text-xs gap-1.5 bg-violet-600 hover:bg-violet-700 text-white">
                      <WandSparkles className="w-4 h-4" /> Studio Hub
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
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
                    Confirm Document Deletion
                  </h3>
                  <p className="text-xs text-foreground/60 font-medium">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <p className="text-sm text-foreground/70 font-medium bg-[#faf8f5] p-3.5 rounded-xl border border-[#e5e1da]">
                Are you sure you want to permanently delete{" "}
                <strong className="text-foreground">
                  "{deletingDoc.name}"
                </strong>{" "}
                along with all associated vector embeddings and chat history?
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
                  Confirm Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
