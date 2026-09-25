"use client";

import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import {
  Search,
  WandSparkles,
  Headphones,
  Network,
  BookOpen,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/db/supabase";
import { useAuth } from "@clerk/nextjs";
import { getFileIcon } from "@/lib/helpers/utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

const iconMap: Record<string, string> = {
  invoice: "Receipt",
  receipt: "Receipt",
  billing: "Receipt",
  finance: "Receipt",
  payment: "Receipt",
  code: "FileCode",
  programming: "FileCode",
  development: "FileCode",
  script: "FileCode",
  legal: "Scale",
  contract: "Scale",
  law: "Scale",
  policy: "Scale",
  terms: "Scale",
  medical: "HeartPulse",
  health: "HeartPulse",
  clinical: "HeartPulse",
  doctor: "HeartPulse",
  book: "BookOpen",
  novel: "BookOpen",
  literature: "BookOpen",
  reading: "BookOpen",
  design: "Palette",
  palette: "Palette",
  creative: "Palette",
  art: "Palette",
  presentation: "Presentation",
  slide: "Presentation",
  pitch: "Presentation",
  data: "Database",
  database: "Database",
  excel: "Database",
  analytics: "Database",
  report: "Database",
  manual: "HelpCircle",
  guide: "HelpCircle",
  tutorial: "HelpCircle",
  help: "HelpCircle",
  resume: "Briefcase",
  cv: "Briefcase",
  portfolio: "Briefcase",
  job: "Briefcase",
  work: "Briefcase",
};

const getDocumentIcon = (doc: Document) => {
  const tags = doc.tags || [];
  const nameParts = doc.name.split(/[\s._-]+/);
  const keywords = [...tags, ...nameParts].map((k) => k.toLowerCase());

  for (const keyword of keywords) {
    const iconName = iconMap[keyword];
    if (iconName && (Icons as any)[iconName]) {
      return (Icons as any)[iconName];
    }
  }

  return getFileIcon(doc.name);
};

export default function StudioPage() {
  const { userId, isLoaded, getToken } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [search, setSearch] = useState("");

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

  const filteredDocs = docs.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#faf8f5] text-foreground flex relative overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 relative z-10 pb-10">
        <div className="p-5 md:p-10 max-w-6xl w-full mx-auto space-y-8 mt-14 md:mt-0">
          {/* Header */}
          <div className="bg-[#ffffff] border border-[#e5e1da] rounded-3xl p-6 md:p-8 shadow-xs space-y-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-violet-500/10 text-violet-700 border border-violet-500/20 inline-flex items-center gap-1.5">
              <WandSparkles className="w-3.5 h-3.5 text-violet-600" />{" "}
              Multi-Modal AI Synthesis Suite
            </span>
            <h1 className="text-2xl md:text-4xl font-heading font-black tracking-tight text-foreground">
              Studio Workspace
            </h1>
            <p className="text-sm text-foreground/70 font-medium">
              Select a document to enter the AI Studio where podcasts, visual
              mind maps, flashcards, and quizzes are generated automatically.
            </p>
          </div>

          {/* Studio Capabilities Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[
              {
                icon: Headphones,
                title: "AI Podcasts",
                desc: "Two-speaker audio summaries",
                color: "text-indigo-600",
                bg: "bg-indigo-50",
              },
              {
                icon: Network,
                title: "Mind Maps",
                desc: "Interactive graph nodes",
                color: "text-violet-600",
                bg: "bg-violet-50",
              },
              {
                icon: BookOpen,
                title: "Flashcards",
                desc: "3D interactive flip cards",
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                icon: HelpCircle,
                title: "Practice Quizzes",
                desc: "Scored Q&A practice tests",
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
            ].map((cap, i) => (
              <div
                key={i}
                className="p-4 bg-[#ffffff] border border-[#e5e1da] rounded-2xl shadow-xs flex flex-col justify-between space-y-2"
              >
                <div
                  className={`w-9 h-9 rounded-xl ${cap.bg} flex items-center justify-center ${cap.color}`}
                >
                  <cap.icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-xs text-foreground">
                    {cap.title}
                  </h4>
                  <p className="text-[10px] text-foreground/50 font-medium">
                    {cap.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Search & Selector Grid */}
          <div className="space-y-6">
            <div className="bg-[#ffffff] border border-[#e5e1da] rounded-2xl p-4 shadow-xs">
              <div className="flex items-center bg-[#faf8f5] border border-[#e5e1da] rounded-xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <Search className="h-4 w-4 text-foreground/40 shrink-0 mr-3" />
                <input
                  type="text"
                  placeholder="Filter document library for Studio processing..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-sm text-foreground placeholder:text-foreground/40 focus:outline-none w-full font-medium"
                />
              </div>
            </div>

            {isLoadingDocs ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-28 rounded-2xl bg-white border border-[#e5e1da] p-5 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="bg-[#ffffff] border border-[#e5e1da] rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto text-violet-600">
                  <WandSparkles className="w-7 h-7" />
                </div>
                <h3 className="font-heading font-bold text-foreground text-lg">
                  No Documents Ready for Studio
                </h3>
                <p className="text-xs text-foreground/60 font-medium">
                  Upload a PDF document to generate audio podcasts and study
                  sets.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs.map((doc) => {
                  const DocIcon = getDocumentIcon(doc);
                  return (
                    <div
                      key={doc.id}
                      onClick={() => router.push(`/studio/${doc.id}`)}
                      className="p-5 bg-[#ffffff] border border-[#e5e1da] rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(139,92,246,0.1)] hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center text-violet-600 group-hover:scale-105 transition-transform shrink-0">
                          <DocIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-heading font-bold text-sm text-foreground truncate group-hover:text-violet-600 transition-colors">
                            {doc.name}
                          </h4>
                          <p className="text-xs text-foreground/50 font-medium flex items-center gap-2 mt-0.5">
                            <span>{doc.size}</span>
                            <span>•</span>
                            <span className="text-violet-600 font-bold">
                              Studio Ready
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="w-9 h-9 rounded-xl bg-neutral-100 group-hover:bg-violet-600 group-hover:text-white text-foreground/50 flex items-center justify-center transition-all shrink-0">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
