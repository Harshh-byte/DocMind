"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Search } from "lucide-react";
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
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Failed to load documents:", error);
          toast.error("Failed to load documents.");
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

  const filteredDocs = docs.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#f9f7f4] flex relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-125 h-125 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-150 h-150 rounded-full bg-violet-400/4 blur-[130px] pointer-events-none" />

      <Sidebar />

      <main className="flex-1 flex flex-col overflow-auto min-w-0 relative z-10">
        <div className="p-4 md:p-8 max-w-4xl w-full mx-auto space-y-8 md:space-y-10 mt-14 md:mt-0">
          <div className="border-b border-[#eae6df]/60 pb-6">
            <h1 className="text-3xl md:text-4xl font-heading font-black leading-tight tracking-tight flex items-center gap-2">
              <span className="shiny-text animate-shine text-primary">
                Chat Assistant
              </span>
            </h1>
            <p className="text-sm text-foreground/75 font-medium mt-1.5">
              Select a document to ask questions, search details, or generate custom highlights.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <input
                  type="text"
                  placeholder="Search document library to start chatting..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-sm bg-white border border-[#eae6df] rounded-2xl pl-11 pr-4 py-3 font-semibold text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-xs"
                />
              </div>
            </div>

            {isLoadingDocs ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-12 bg-white/40 border border-dashed border-[#eae6df] rounded-3xl p-8">
                <FileText className="h-10 w-10 text-foreground/25 mx-auto mb-3" />
                <h3 className="font-heading font-black text-foreground text-base">
                  No Documents Loaded
                </h3>
                <p className="text-xs text-foreground/50 font-medium mt-1">
                  Upload a PDF in the Upload tab first to chat with it.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs.map((doc) => {
                  const DocIcon = getDocumentIcon(doc);
                  return (
                    <button
                      key={doc.id}
                      onClick={() => router.push(`/chat/${doc.id}`)}
                      className="flex text-left items-start gap-4 p-5 bg-white border border-[#eae6df] rounded-3xl hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="h-10 w-10 rounded-2xl bg-primary/8 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-300 shrink-0 shadow-inner">
                        <DocIcon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h4 className="font-heading font-black text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {doc.name}
                        </h4>
                        <p className="text-xs text-foreground/45 font-semibold">
                          Added on {doc.date}
                        </p>
                      </div>
                    </button>
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
