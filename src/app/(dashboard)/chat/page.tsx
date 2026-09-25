"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  BotMessageSquare,
  ArrowRight,
} from "lucide-react";
import * as Icons from "lucide-react";
import { getSupabaseClient } from "@/lib/db/supabase";
import { useAuth } from "@clerk/nextjs";
import { getFileIcon } from "@/lib/helpers/utils";
import { Sidebar } from "@/components/layout/Sidebar";
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
  const nameParts = doc.name.split(/[\s._-]+/);
  const keywords = [...nameParts].map((k) => k.toLowerCase());

  for (const keyword of keywords) {
    const iconName = iconMap[keyword];
    if (iconName && (Icons as any)[iconName]) {
      return (Icons as any)[iconName];
    }
  }

  return getFileIcon(doc.name);
};

export default function ChatPage() {
  const router = useRouter();
  const { userId, isLoaded, getToken } = useAuth();
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
        <div className="p-5 md:p-10 max-w-5xl w-full mx-auto space-y-8 mt-14 md:mt-0">
          {/* Header */}
          <div className="bg-[#ffffff] border border-[#e5e1da] rounded-3xl p-6 md:p-8 shadow-xs space-y-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-primary/10 text-primary border border-primary/20 inline-flex items-center gap-1.5">
              <BotMessageSquare className="w-3.5 h-3.5 text-primary" /> RAG
              Conversational Engine
            </span>
            <h1 className="text-2xl md:text-4xl font-heading font-black tracking-tight text-foreground">
              Chat Assistant Selector
            </h1>
            <p className="text-sm text-foreground/70 font-medium">
              Select any document in your library to start an interactive
              streaming AI session with page-level citations.
            </p>
          </div>

          <div className="space-y-6">
            {/* Search Input */}
            <div className="bg-[#ffffff] border border-[#e5e1da] rounded-2xl p-4 shadow-xs">
              <div className="flex items-center bg-[#faf8f5] border border-[#e5e1da] rounded-xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <Search className="h-4 w-4 text-foreground/40 shrink-0 mr-3" />
                <input
                  type="text"
                  placeholder="Search document to launch chat session..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-sm text-foreground placeholder:text-foreground/40 focus:outline-none w-full font-medium"
                />
              </div>
            </div>

            {/* Document Selector Grid */}
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
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                  <BotMessageSquare className="w-7 h-7" />
                </div>
                <h3 className="font-heading font-bold text-foreground text-lg">
                  No Documents Ready
                </h3>
                <p className="text-xs text-foreground/60 font-medium">
                  Upload a PDF in the Upload section to start chatting with it.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs.map((doc) => {
                  const DocIcon = getDocumentIcon(doc);
                  return (
                    <div
                      key={doc.id}
                      onClick={() => router.push(`/chat/${doc.id}`)}
                      className="p-5 bg-[#ffffff] border border-[#e5e1da] rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(79,70,229,0.08)] hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                          <DocIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-heading font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {doc.name}
                          </h4>
                          <p className="text-xs text-foreground/50 font-medium flex items-center gap-2 mt-0.5">
                            <span>{doc.size}</span>
                            <span>•</span>
                            <span className="text-emerald-600 font-bold">
                              {doc.vectors} vectors
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="w-9 h-9 rounded-xl bg-neutral-100 group-hover:bg-primary group-hover:text-white text-foreground/50 flex items-center justify-center transition-all shrink-0">
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
