"use client";

import React, { useState, useRef, useEffect, Suspense, use } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  FileText,
  BotMessageSquare,
  X,
  Settings,
  Volume2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/Sidebar";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@clerk/nextjs";
import { getSupabaseClient } from "@/lib/db/supabase";
import {
  GEMINI_MODEL_LITE,
  GEMINI_MODEL_FLASH,
  VOICES,
} from "@/lib/config/constants";
import { cn, getFileIcon } from "@/lib/helpers/utils";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Document {
  id: string;
  name: string;
  date: string;
  size: string;
  vectors: number;
  rawSize: number;
  text?: string;
}

const CitationBadge = ({
  citationText,
  onClick,
  docText,
  assistantMsg,
  messages,
}: {
  citationText: string;
  onClick: () => void;
  docText: string;
  assistantMsg: string;
  messages: Message[];
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getPreviewText = () => {
    const match = citationText.match(/Page (\d+)/i);
    const pageNum = match ? parseInt(match[1], 10) : 1;
    const pageContent = getPageSnippet(docText || "", pageNum);

    const msgIndex = messages.findIndex((m) => m.content === assistantMsg);
    const userQuery = msgIndex > 0 ? messages[msgIndex - 1].content : "";

    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "if",
      "then",
      "else",
      "when",
      "where",
      "why",
      "how",
      "what",
      "who",
      "whom",
      "this",
      "that",
      "these",
      "those",
      "is",
      "am",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "to",
      "from",
      "in",
      "on",
      "at",
      "by",
      "with",
      "about",
      "for",
      "of",
      "off",
      "out",
      "over",
      "under",
      "again",
      "further",
      "then",
      "once",
      "here",
      "there",
      "all",
      "any",
      "both",
      "each",
      "few",
      "more",
      "most",
      "other",
      "some",
      "such",
      "no",
      "nor",
      "not",
      "only",
      "own",
      "same",
      "so",
      "than",
      "too",
      "very",
      "can",
      "will",
      "just",
      "should",
      "now",
    ]);

    const cleanText = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopWords.has(w));
    };

    const queryKeywords = cleanText(userQuery);
    const assistantKeywords = cleanText(assistantMsg);
    const keywords = Array.from(
      new Set([...queryKeywords, ...assistantKeywords]),
    );

    const segments = pageContent
      .split(/\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const scored = segments.map((segment) => {
      const segmentLower = segment.toLowerCase();
      let score = 0;
      keywords.forEach((kw) => {
        if (segmentLower.includes(kw)) {
          score += 1;
        }
      });
      return { segment, score };
    });

    const matches = scored.filter((s) => s.score > 0);
    matches.sort((a, b) => b.score - a.score);

    const rawSnippet =
      matches.length > 0 ? matches[0].segment : pageContent.split("\n")[0];

    if (rawSnippet && rawSnippet.length > 140) {
      return rawSnippet.slice(0, 140) + "...";
    }
    return rawSnippet || "No reference text available.";
  };

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        onClick={onClick}
        className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 cursor-pointer select-none hover:bg-primary/25 hover:scale-105 active:scale-95 transition-all shadow-xs"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        {citationText}
      </span>

      <AnimatePresence>
        {isHovered && (
          <motion.span
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white border border-[#eae6df] text-foreground p-3 rounded-xl shadow-xl text-[11px] leading-normal font-semibold z-50 pointer-events-none text-left"
          >
            <span className="text-[9px] uppercase tracking-wider text-primary font-bold block mb-1">
              Source Preview
            </span>
            <span className="text-foreground/75 block whitespace-normal">
              {getPreviewText()}
            </span>
            <span className="text-[9px] text-foreground/35 block mt-1.5 border-t border-[#eae6df]/60 pt-1 text-center font-bold">
              Click to view full reference page
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};

const formatMessage = (
  content: string,
  onCitationClick: (citationText: string) => void,
  docText: string,
  messages: Message[],
) => {
  const parts = content.split(
    /(\*\*.*?\*\*|\[Page \d+, Line \d+\]|\[Page \d+\])/g,
  );
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("[Page ") && part.endsWith("]")) {
      const citationText = part.slice(1, -1);
      return (
        <CitationBadge
          key={i}
          citationText={citationText}
          onClick={() => onCitationClick(citationText)}
          docText={docText}
          assistantMsg={content}
          messages={messages}
        />
      );
    }
    return part;
  });
};

function getPageSnippet(docText: string, pageNum: number): string {
  if (!docText) return "";
  const pageMarker = `[Page ${pageNum}]`;
  const nextPageMarker = `[Page ${pageNum + 1}]`;

  const startIdx = docText.indexOf(pageMarker);
  if (startIdx === -1) return "";

  const contentStart = startIdx + pageMarker.length;
  const endIdx = docText.indexOf(nextPageMarker, contentStart);

  const pageContent =
    endIdx === -1
      ? docText.slice(contentStart)
      : docText.slice(contentStart, endIdx);

  return pageContent.trim();
}

function renderHighlightedText(text: string, keywords: string[]) {
  if (!keywords || keywords.length === 0) return text;

  const escapedKws = keywords
    .map((k) => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"))
    .filter(Boolean);
  if (escapedKws.length === 0) return text;

  const regex = new RegExp(`(${escapedKws.join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) => {
    const isMatch = keywords.some(
      (kw) => kw.toLowerCase() === part.toLowerCase(),
    );
    return isMatch ? (
      <mark
        key={i}
        className="bg-primary/20 text-primary font-bold px-0.5 rounded"
      >
        {part}
      </mark>
    ) : (
      part
    );
  });
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

interface ChatContentProps {
  docId: string;
}

function ChatContent({ docId }: ChatContentProps) {
  const router = useRouter();
  const { userId, isLoaded, getToken } = useAuth();

  const [docs, setDocs] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [model, setModel] = useState(GEMINI_MODEL_LITE);
  const [voice, setVoice] = useState("Aoede");
  const [showSettings, setShowSettings] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const messagesRef = useRef<Message[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const handleVoiceMessageSave = async (
    role: "user" | "assistant",
    content: string,
  ) => {
    if (!userId || !docId) return;
    const newMsg: Message = { role, content };
    const updated = [...messagesRef.current, newMsg];

    setMessages(updated);

    try {
      let token = null;
      try {
        token = await getToken({ template: "Supabase" });
      } catch (authErr) {
        console.warn("Clerk Supabase JWT template not found:", authErr);
      }
      const supabaseClient = getSupabaseClient(token || "");
      const { error } = await supabaseClient.from("chats").upsert(
        {
          user_id: userId,
          document_id: docId,
          messages: updated,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,document_id" },
      );
      if (error) {
        console.error("Error saving voice chat message to history:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
      }
    } catch (err: any) {
      console.error("Error saving voice chat message to history:", err);
    }
  };

  const [previewPlayingId, setPreviewPlayingId] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, []);

  const playVoicePreview = async (voiceId: string, voiceName: string) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setPreviewPlayingId(null);

    setPreviewLoadingId(voiceId);
    try {
      const cleanName = voiceName.split(" ")[0];
      const res = await fetch("/api/studio/podcast/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: [
            {
              speaker: cleanName,
              text: `Hello, I am your voice assistant, powered by the ${cleanName} voice model. I am ready to help you analyze your documents.`,
            },
          ],
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch preview audio");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      previewAudioRef.current = audio;

      audio.onplay = () => {
        setPreviewLoadingId(null);
        setPreviewPlayingId(voiceId);
      };

      audio.onended = () => {
        setPreviewPlayingId(null);
      };

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
  };

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

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const resolvedDoc = docs.find((d) => d.id === docId);
  const docName = resolvedDoc?.name || "Your File";

  const [activeCitation, setActiveCitation] = useState<{
    citationText: string;
    pageContent: string;
    keywords: string[];
  } | null>(null);

  const handleCitationClick = (citationText: string, assistantMsg: string) => {
    const match = citationText.match(/Page (\d+)/i);
    const pageNum = match ? parseInt(match[1], 10) : 1;
    const pageContent = getPageSnippet(resolvedDoc?.text || "", pageNum);

    const msgIndex = messages.findIndex((m) => m.content === assistantMsg);
    const userQuery = msgIndex > 0 ? messages[msgIndex - 1].content : "";

    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "if",
      "then",
      "else",
      "when",
      "where",
      "why",
      "how",
      "what",
      "who",
      "whom",
      "this",
      "that",
      "these",
      "those",
      "is",
      "am",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "to",
      "from",
      "in",
      "on",
      "at",
      "by",
      "with",
      "about",
      "for",
      "of",
      "off",
      "out",
      "over",
      "under",
      "again",
      "further",
      "then",
      "once",
      "here",
      "there",
      "all",
      "any",
      "both",
      "each",
      "few",
      "more",
      "most",
      "other",
      "some",
      "such",
      "no",
      "nor",
      "not",
      "only",
      "own",
      "same",
      "so",
      "than",
      "too",
      "very",
      "can",
      "will",
      "just",
      "should",
      "now",
    ]);

    const cleanText = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopWords.has(w));
    };

    const queryKeywords = cleanText(userQuery);
    const assistantKeywords = cleanText(assistantMsg);
    const keywords = Array.from(
      new Set([...queryKeywords, ...assistantKeywords]),
    );

    setActiveCitation({
      citationText,
      pageContent,
      keywords,
    });
  };

  useEffect(() => {
    if (!userId || !docId) return;

    const fetchChatHistory = async () => {
      try {
        let token = null;
        try {
          token = await getToken({ template: "Supabase" });
        } catch (authErr) {
          console.warn("Clerk Supabase JWT template not found:", authErr);
        }

        const supabaseClient = getSupabaseClient(token || "");
        const { data, error } = await supabaseClient
          .from("chats")
          .select("messages")
          .eq("user_id", userId)
          .eq("document_id", docId)
          .single();

        if (error) {
          if (error.code !== "PGRST116") {
            console.error("Error loading chat history:", error);
          }
        } else if (data && data.messages) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchChatHistory();
  }, [userId, docId, isLoaded]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || !resolvedDoc) return;

    const userMessageContent = input.trim();
    const newMsg: Message = { role: "user", content: userMessageContent };
    const updatedMessages = [...messages, newMsg];

    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessageContent,
          history: updatedMessages.slice(0, -1),
          documentText: resolvedDoc.text || "",
          model: model,
        }),
      });

      if (!response.ok) throw new Error("Failed to query assistant");

      const data = await response.json();
      const assistantMessageContent = data.response;
      const finalMessages = [
        ...updatedMessages,
        { role: "assistant", content: assistantMessageContent } as Message,
      ];

      setMessages(finalMessages);

      let token = null;
      try {
        token = await getToken({ template: "Supabase" });
      } catch (authErr) {
        console.warn("Clerk Supabase JWT template not found:", authErr);
      }

      const supabaseClient = getSupabaseClient(token || "");
      const { error } = await supabaseClient.from("chats").upsert(
        {
          user_id: userId,
          document_id: docId,
          messages: finalMessages,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,document_id" },
      );

      if (error) {
        console.error("Error saving chat history to Supabase:", error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to get response from assistant.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = async () => {
    if (!userId || !docId) return;

    try {
      let token = null;
      try {
        token = await getToken({ template: "Supabase" });
      } catch (authErr) {
        console.warn("Clerk Supabase JWT template not found:", authErr);
      }

      const supabaseClient = getSupabaseClient(token || "");
      const { error } = await supabaseClient
        .from("chats")
        .delete()
        .eq("user_id", userId)
        .eq("document_id", docId);

      if (error) {
        console.error("Error clearing chat history:", error);
        toast.error("Failed to clear chat history.");
      } else {
        setMessages([]);
        toast.success("Chat history cleared!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isLoaded || isLoadingDocs) {
    return (
      <div className="min-h-screen bg-[#f9f7f4] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!resolvedDoc) {
    return (
      <div className="min-h-screen bg-[#f9f7f4] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          <p className="text-sm font-bold text-foreground/60">
            Resolving workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-foreground flex relative overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        <div className="flex-1 flex flex-col min-h-0 bg-transparent relative">
          <div className="shrink-0 bg-[#ffffff] border-b border-[#e5e1da] px-4 py-4 sm:px-8 flex items-center justify-between mt-14 md:mt-0 shadow-xs">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push("/chat")}
                variant="ghost"
                className="group rounded-xl font-bold cursor-pointer text-[11px] flex items-center gap-1.5 px-3 py-2 bg-white border border-[#eae6df] text-foreground/75 hover:text-foreground hover:bg-[#eae6df]/15 hover:border-[#eae6df]/90 active:scale-95 transition-all shadow-xs shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
                <span>Back</span>
              </Button>
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-foreground/75" />
                <h2 className="text-sm font-heading font-black text-foreground flex items-center gap-1.5">
                  {docName}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "h-9 w-9 rounded-xl border border-[#eae6df] bg-white text-foreground/60 hover:text-foreground cursor-pointer shadow-xs",
                  showSettings &&
                    "border-primary/50 text-primary bg-primary/5 hover:bg-primary/5 hover:text-primary",
                )}
                title="Workspace Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                onClick={handleClearHistory}
                disabled={messages.length === 0}
                className="rounded-xl px-3 h-9 font-bold text-[10px] text-red-600 border border-red-100 bg-red-50/20 hover:bg-red-50 hover:text-red-700 cursor-pointer shadow-xs disabled:opacity-40"
              >
                Clear Chat
              </Button>
            </div>
          </div>

          <div className="flex-1 flex min-h-0 relative">
            <div className="flex-1 flex flex-col min-h-0 relative">
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-5 md:space-y-6"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 shadow-inner">
                      <BotMessageSquare className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-heading font-black text-foreground">
                        Document Assistant
                      </h3>
                      <p className="text-xs text-foreground/50 leading-relaxed font-semibold">
                        Ask questions, request summaries, or locate details
                        directly within{" "}
                        <span className="text-primary font-bold">
                          {docName}
                        </span>
                        .
                      </p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-start gap-3`}
                      >
                        {msg.role === "assistant" && (
                          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/5 mt-0.5">
                            <BotMessageSquare className="h-4 w-4" />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] md:max-w-[68%] px-4.5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all duration-200 ${
                            msg.role === "user"
                              ? "bg-linear-to-r from-primary to-indigo-600 text-white rounded-tr-none font-medium"
                              : "bg-white border border-[#eae6df] text-foreground rounded-tl-none font-medium"
                          }`}
                        >
                          {formatMessage(
                            msg.content,
                            (citeText) =>
                              handleCitationClick(citeText, msg.content),
                            resolvedDoc.text || "",
                            messages,
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start items-start gap-3"
                  >
                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/5 mt-0.5">
                      <BotMessageSquare className="h-4 w-4" />
                    </div>
                    <div className="bg-white border border-[#eae6df] rounded-2xl rounded-tl-none px-4.5 py-3.5 flex gap-1.5 items-center shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-primary/45 animate-bounce [animation-delay:0ms]" />
                      <span className="h-2 w-2 rounded-full bg-primary/45 animate-bounce [animation-delay:150ms]" />
                      <span className="h-2 w-2 rounded-full bg-primary/45 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="shrink-0 bg-white/50 backdrop-blur-md border-t border-[#eae6df]/60 px-4 py-4 sm:px-8">
                <form
                  onSubmit={handleSend}
                  className="max-w-3xl mx-auto flex items-center gap-3"
                >
                  <div className="flex-1 bg-white border border-[#eae6df] rounded-2xl flex items-center gap-3 px-4 py-3 focus-within:outline-none focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-xs">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={`Ask about ${docName}...`}
                      className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none py-1 min-w-0 text-foreground font-semibold placeholder:text-foreground/30"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    size="icon"
                    className="h-11 w-11 rounded-2xl shrink-0 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                <p className="text-center text-[9px] sm:text-[10px] text-foreground/30 font-medium mt-2 tracking-wider">
                  DocMind can be inaccurate, so double-check.
                </p>
              </div>
            </div>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="w-72 bg-white border-l border-[#eae6df]/80 shadow-xs flex flex-col p-6 space-y-6 shrink-0 h-full overflow-y-auto"
                >
                  <div className="flex items-center justify-between border-b border-[#eae6df]/60 pb-3">
                    <h3 className="font-heading font-black text-sm text-foreground">
                      Workspace Config
                    </h3>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="text-foreground/40 hover:text-foreground transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <style>{`
                    .custom-scrollbar::-webkit-scrollbar {
                      width: 5px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                      background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                      background: #eae6df/60;
                      border-radius: 99px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                      background: #4f46e5/35;
                    }
                  `}</style>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-foreground/45 tracking-wider block">
                      Intelligence Model
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 bg-[#f9f7f4]/80 p-1 border border-[#eae6df]/85 rounded-xl relative">
                      <button
                        type="button"
                        onClick={() => setModel(GEMINI_MODEL_LITE)}
                        className={cn(
                          "relative z-10 py-1.5 rounded-lg text-xs font-bold text-center transition-colors duration-200 cursor-pointer flex flex-col items-center justify-center",
                          model === GEMINI_MODEL_LITE
                            ? "text-primary"
                            : "text-foreground/50 hover:text-foreground/80",
                        )}
                      >
                        {model === GEMINI_MODEL_LITE && (
                          <motion.div
                            layoutId="activeModelTab"
                            className="absolute inset-0 bg-white border border-[#eae6df]/85 rounded-lg shadow-2xs -z-10"
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 30,
                            }}
                          />
                        )}
                        <span className="leading-none">Quick</span>
                        <span className="text-[8px] opacity-75 font-medium leading-none mt-0.5">
                          Research
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setModel(GEMINI_MODEL_FLASH)}
                        className={cn(
                          "relative z-10 py-1.5 rounded-lg text-xs font-bold text-center transition-colors duration-200 cursor-pointer flex flex-col items-center justify-center",
                          model === GEMINI_MODEL_FLASH
                            ? "text-primary"
                            : "text-foreground/50 hover:text-foreground/80",
                        )}
                      >
                        {model === GEMINI_MODEL_FLASH && (
                          <motion.div
                            layoutId="activeModelTab"
                            className="absolute inset-0 bg-white border border-[#eae6df]/85 rounded-lg shadow-2xs -z-10"
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 30,
                            }}
                          />
                        )}
                        <span className="leading-none">Deep</span>
                        <span className="text-[8px] opacity-75 font-medium leading-none mt-0.5">
                          Research
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-foreground/45 tracking-wider block">
                      Voice Model Assistant
                    </label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                      {VOICES.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setVoice(v.id);
                            playVoicePreview(v.id, v.name);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex justify-between items-center",
                            voice === v.id
                              ? "border-primary bg-primary/5 text-primary shadow-2xs"
                              : "border-[#eae6df]/85 bg-white text-foreground/75 hover:bg-slate-50",
                          )}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="leading-normal truncate">
                              {v.name}
                            </span>
                            <span className="text-[9px] text-foreground/40 font-semibold leading-none mt-0.5 truncate">
                              {v.desc}
                            </span>
                          </div>
                          <div className="shrink-0 flex items-center justify-center min-w-4">
                            {previewLoadingId === v.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                            ) : previewPlayingId === v.id ? (
                              <Volume2 className="h-3.5 w-3.5 text-primary animate-pulse" />
                            ) : voice === v.id ? (
                              <Volume2 className="h-3.5 w-3.5 text-primary opacity-60 hover:opacity-100 transition-opacity" />
                            ) : null}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {activeCitation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-[#eae6df] rounded-2xl shadow-xl max-w-xl w-full overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-5 border-b border-[#eae6df] flex items-center justify-between bg-zinc-50/50">
                <div>
                  <h3 className="font-heading font-black text-foreground text-base">
                    Citation Reference
                  </h3>
                  <p className="text-[11px] text-foreground/50 font-semibold mt-0.5 truncate max-w-70 sm:max-w-md">
                    {docName} • {activeCitation.citationText}
                  </p>
                </div>
                <button
                  onClick={() => setActiveCitation(null)}
                  className="p-1.5 rounded-xl hover:bg-black/5 text-foreground/45 hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 text-sm text-foreground/75 leading-relaxed font-medium bg-[#f9f7f4]/15 whitespace-pre-wrap">
                {activeCitation.pageContent}
              </div>
              <div className="p-4 border-t border-[#eae6df] flex justify-end bg-zinc-50/50">
                <Button
                  onClick={() => setActiveCitation(null)}
                  className="rounded-xl px-5 py-2 text-xs font-semibold shadow-xs"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ChatDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f9f7f4] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <ChatContent docId={resolvedParams.id} />
    </Suspense>
  );
}
