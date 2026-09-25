"use client";

import { useState, useEffect, useRef, useMemo, use } from "react";
import * as Icons from "lucide-react";
import {
  BookOpen,
  Headphones,
  Network,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Play,
  Pause,
  FileText,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { toast } from "sonner";
import { getSupabaseClient } from "@/lib/db/supabase";
import { useAuth } from "@clerk/nextjs";
import { cn, getFileIcon } from "@/lib/helpers/utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { useRouter } from "next/navigation";

import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toPng } from "html-to-image";

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

  for (const keyword of keywords) {
    const capitalized = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    if ((Icons as any)[capitalized]) {
      return (Icons as any)[capitalized];
    }
  }

  return getFileIcon(doc.name);
};

interface PodcastLine {
  speaker: "Adam" | "Sarah";
  text: string;
}

interface MindMapNode {
  name: string;
  children?: MindMapNode[];
}

interface Flashcard {
  question: string;
  answer: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

interface StudyData {
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

const MindMapNodeComponent = ({ data }: any) => {
  const isRoot = data.depth === 0;
  const isSelected = data.isSelected;
  const isEditing = data.editingNodeId === data.id;

  return (
    <div
      className={cn(
        "relative w-42.5 min-h-11 rounded-xl flex items-center justify-between px-3 py-2 font-bold text-[11px] transition-all duration-300 border shadow-xs group select-none",
        isRoot
          ? "bg-[#4f46e5] text-white border-transparent"
          : isSelected
            ? "bg-white text-[#4f46e5] border-2 border-[#4f46e5]"
            : "bg-white text-slate-800 border-[#eae6df] hover:border-[#4f46e5]"
      )}
      onDoubleClick={(e) => {
        e.stopPropagation();
        data.onStartEdit(data.id, data.name);
      }}
      onClick={(e) => {
        e.stopPropagation();
        data.onSelectNode(data.id);
      }}
    >
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
        />
      )}

      <div className="w-full flex items-center justify-between gap-1 overflow-hidden">
        {isEditing ? (
          <input
            type="text"
            value={data.editingValue}
            onChange={(e) => data.setEditingValue(e.target.value)}
            onBlur={() => data.onSaveEdit(data.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") data.onSaveEdit(data.id);
              if (e.key === "Escape") data.onCancelEdit();
            }}
            className="w-full h-full text-[11px] font-bold border-0 p-0 focus:outline-none bg-transparent text-inherit"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate w-full pr-1">{data.name}</span>
        )}

        {data.hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onToggleCollapse(data.id);
            }}
            className={cn(
              "w-4 h-4 rounded-full flex items-center justify-center border-0 cursor-pointer shadow-2xs shrink-0 select-none font-sans font-bold",
              isRoot ? "bg-white text-[#4f46e5]" : "bg-[#4f46e5] text-white"
            )}
          >
            {data.isCollapsed ? (
              <Icons.Plus className="w-2.5 h-2.5 stroke-3" />
            ) : (
              <Icons.Minus className="w-2.5 h-2.5 stroke-3" />
            )}
          </button>
        )}
      </div>

      <div className="absolute left-2 -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 z-20 pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onAddSubNode(data.id);
          }}
          className="w-4.5 h-4.5 rounded-full bg-[#10b981] flex items-center justify-center text-white cursor-pointer border-0"
        >
          <Icons.Plus className="w-2.5 h-2.5 stroke-3" />
        </button>
        {!isRoot && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDeleteNode(data.id);
            }}
            className="w-4.5 h-4.5 rounded-full bg-[#ef4444] flex items-center justify-center text-white cursor-pointer border-0"
          >
            <Icons.X className="w-2.5 h-2.5 stroke-3" />
          </button>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
      />
    </div>
  );
};

const nodeTypes = {
  mindMapNode: MindMapNodeComponent,
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StudioDocumentPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const docId = resolvedParams.id;
  const router = useRouter();

  const { userId, isLoaded, getToken } = useAuth();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(true);
  const SelectedDocIcon = selectedDoc ? getDocumentIcon(selectedDoc) : FileText;

  const [activeTool, setActiveTool] = useState<
    "menu" | "podcast" | "mindmap" | "flashcards" | "quiz"
  >("menu");
  const [loadingContent, setLoadingContent] = useState(false);

  const [podcastScript, setPodcastScript] = useState<
    (PodcastLine & { start: number; end: number })[]
  >([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const activeSpeaker = podcastScript.find(
    (line) => currentTime >= line.start && currentTime <= line.end
  )?.speaker;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;

    const initAudioContext = () => {
      if (audioContextRef.current) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        
        const source = ctx.createMediaElementSource(audioRef.current!);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        
        sourceRef.current = source;
        audioContextRef.current = ctx;
        analyserRef.current = analyser;
      } catch (err) {
        console.warn("Failed to init Web Audio API:", err);
      }
    };

    let active = true;
    const draw = () => {
      if (!canvasRef.current || !analyserRef.current) {
        if (active) animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const render = () => {
        if (!active || !canvas || !analyserRef.current) return;
        animationFrameRef.current = requestAnimationFrame(render);
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        ctx.fillStyle = "rgba(15, 23, 42, 0.15)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 1.6;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
          const rawVal = dataArray[i];
          const barHeight = (rawVal / 255) * canvas.height * 0.85 + 4;
          
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, "rgba(79, 70, 229, 0.2)");
          gradient.addColorStop(0.5, "rgba(99, 102, 241, 0.8)");
          gradient.addColorStop(1, "rgba(139, 92, 246, 1)");
          
          ctx.fillStyle = gradient;
          
          ctx.beginPath();
          ctx.roundRect(x, canvas.height - barHeight, barWidth - 3, barHeight, [4, 4, 0, 0]);
          ctx.fill();
          
          x += barWidth;
        }
      };
      
      render();
    };

    if (isPlaying) {
      initAudioContext();
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }
      draw();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, audioUrl]);

  const [mindMapData, setMindMapData] = useState<MindMapNode | null>(null);
  const [selectedNodePath, setSelectedNodePath] = useState<string | null>(null);

  const [studyData, setStudyData] = useState<StudyData | null>(null);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [srsRatings, setSrsRatings] = useState<Record<number, "easy" | "good" | "hard">>({});
  const [showSrsRecap, setShowSrsRecap] = useState(false);
  
  const [quizCurrentIdx, setQuizCurrentIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});
  const [quizElapsedTime, setQuizElapsedTime] = useState(0);
  const [quizTimerActive, setQuizTimerActive] = useState(false);

  useEffect(() => {
    if (!isLoaded || !userId || !docId) return;

    const fetchDoc = async () => {
      setIsLoadingDoc(true);
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
          .eq("id", docId)
          .single();

        if (error || !data) {
          console.error("Failed to load document:", error);
          toast.error("Failed to load document studio workspace.");
          router.push("/studio");
        } else {
          setSelectedDoc({
            id: data.id,
            name: data.name,
            date: data.date,
            size: data.size,
            vectors: data.vectors,
            rawSize: data.raw_size,
            text: data.text,
            summary: data.summary,
            tags: data.tags,
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("An error occurred loading the studio workspace.");
      } finally {
        setIsLoadingDoc(false);
      }
    };

    fetchDoc();
  }, [userId, isLoaded, docId]);

  useEffect(() => {
    if (!selectedDoc) {
      setPodcastScript([]);
      setAudioUrl(null);
      setMindMapData(null);
      setStudyData(null);
      return;
    }

    const parts = (selectedDoc.summary || "").split("|||STUDIO_DATA|||");
    const studioJsonStr = parts[1];

    if (studioJsonStr) {
      try {
        const studioDataObj = JSON.parse(studioJsonStr);
        const rawScript: PodcastLine[] = studioDataObj.podcastScript || [];
        let cumulativeTime = 0;
        const timedScript = rawScript.map((line) => {
          const words = line.text.split(/\s+/).length;
          const duration = words * 0.48 + 0.6;
          const start = cumulativeTime;
          const end = cumulativeTime + duration;
          cumulativeTime = end;
          return { ...line, start, end };
        });
        setPodcastScript(timedScript);
        setMindMapData(studioDataObj.mindMapData || null);
        setStudyData(studioDataObj.studyData || null);
      } catch (e) {
        console.error("Failed to parse cached studio data:", e);
        setPodcastScript([]);
        setMindMapData(null);
        setStudyData(null);
      }
    } else {
      setPodcastScript([]);
      setMindMapData(null);
      setStudyData(null);
    }

    setAudioUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [selectedDoc]);

  const compilePodcastAudio = async (scriptToUse = podcastScript) => {
    if (scriptToUse.length === 0) return;
    setLoadingContent(true);
    try {
      const audioRes = await fetch("/api/studio/podcast/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: scriptToUse.map(s => ({ speaker: s.speaker, text: s.text })) }),
      });
      if (!audioRes.ok) throw new Error("Failed to compile podcast audio.");

      const blob = await audioRes.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to compile podcast audio.");
    } finally {
      setLoadingContent(false);
    }
  };

  useEffect(() => {
    if (activeTool === "podcast" && podcastScript.length > 0 && !audioUrl && !loadingContent) {
      compilePodcastAudio();
    }
  }, [activeTool, podcastScript, audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, audioUrl]);

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentTime]);

  useEffect(() => {
    if (activeTool !== "flashcards" || !studyData || showSrsRecap) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === "ArrowLeft") {
        if (currentCardIdx > 0) {
          setIsFlipped(false);
          setTimeout(() => setCurrentCardIdx(prev => prev - 1), 150);
        }
      } else if (e.code === "ArrowRight") {
        if (currentCardIdx < studyData.flashcards.length - 1) {
          setIsFlipped(false);
          setTimeout(() => setCurrentCardIdx(prev => prev + 1), 150);
        }
      } else if (isFlipped) {
        if (e.key === "1") handleSrsRate("hard");
        else if (e.key === "2") handleSrsRate("good");
        else if (e.key === "3") handleSrsRate("easy");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTool, studyData, currentCardIdx, isFlipped, showSrsRecap]);

  useEffect(() => {
    if (activeTool !== "quiz" || !studyData) {
      setQuizTimerActive(false);
      return;
    }
    const totalQuizQuestions = studyData.quiz.length;
    const submittedCount = Object.keys(quizSubmitted).length;
    const isQuizComplete = totalQuizQuestions > 0 && submittedCount === totalQuizQuestions;

    if (isQuizComplete) {
      setQuizTimerActive(false);
    } else {
      setQuizTimerActive(true);
    }
  }, [activeTool, studyData, quizSubmitted]);

  useEffect(() => {
    let interval: any = null;
    if (quizTimerActive) {
      interval = setInterval(() => {
        setQuizElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [quizTimerActive]);
  
  const saveStudioDataToDb = async (updatedFields: {
    podcastScript?: any;
    mindMapData?: any;
    studyData?: any;
  }) => {
    if (!selectedDoc || !userId) return;

    try {
      let token = null;
      try {
        token = await getToken({ template: "Supabase" });
      } catch (authErr) {
        console.warn("Clerk Supabase token fetch failed:", authErr);
      }

      const supabaseClient = getSupabaseClient(token || "");

      const { data: docData } = await supabaseClient
        .from("documents")
        .select("summary")
        .eq("id", selectedDoc.id)
        .single();

      const currentSummaryRaw = docData?.summary || "";
      const textSummary = currentSummaryRaw.split("|||STUDIO_DATA|||")[0] || "";

      let currentStudioObj: any = {};
      const studioJsonStr = currentSummaryRaw.split("|||STUDIO_DATA|||")[1];
      if (studioJsonStr) {
        try {
          currentStudioObj = JSON.parse(studioJsonStr);
        } catch {}
      }

      const newStudioObj = {
        ...currentStudioObj,
        ...updatedFields
      };

      const newSummaryRaw = `${textSummary}|||STUDIO_DATA|||${JSON.stringify(newStudioObj)}`;

      const { error } = await supabaseClient
        .from("documents")
        .update({ summary: newSummaryRaw })
        .eq("id", selectedDoc.id);

      if (error) {
        console.error("Failed to save studio assets to database:", error);
      } else {
        selectedDoc.summary = newSummaryRaw;
      }
    } catch (err) {
      console.error("Error saving studio assets:", err);
    }
  };

  const handleBackToMenu = () => {
    setActiveTool("menu");
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentCardIdx(0);
    setIsFlipped(false);
    setShowSrsRecap(false);
    setSrsRatings({});
    setPlaybackRate(1);
    setQuizCurrentIdx(0);
    setQuizAnswers({});
    setQuizSubmitted({});
    setQuizElapsedTime(0);
    setQuizTimerActive(false);
    setSelectedNodePath(null);
  };

  const generatePodcast = async () => {
    if (!selectedDoc) return;
    setLoadingContent(true);
    setPodcastScript([]);
    setAudioUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    try {
      const scriptRes = await fetch("/api/studio/podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentName: selectedDoc.name,
          documentText: selectedDoc.text || "",
        }),
      });
      if (!scriptRes.ok) throw new Error("Failed to generate script.");
      const scriptData = await scriptRes.json();
      const rawScript: PodcastLine[] = scriptData.script;

      let cumulativeTime = 0;
      const timedScript = rawScript.map((line) => {
        const words = line.text.split(/\s+/).length;
        const duration = words * 0.48 + 0.6;
        const start = cumulativeTime;
        const end = cumulativeTime + duration;
        cumulativeTime = end;
        return { ...line, start, end };
      });
      setPodcastScript(timedScript);

      await saveStudioDataToDb({ podcastScript: timedScript });
      await compilePodcastAudio(timedScript);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate podcast.");
      setLoadingContent(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (val: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = val;
    setCurrentTime(val);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const generateMindMap = async () => {
    if (!selectedDoc) return;
    setLoadingContent(true);
    try {
      const res = await fetch("/api/studio/mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentName: selectedDoc.name,
          documentText: selectedDoc.text || "",
        }),
      });
      if (!res.ok) throw new Error("Failed to generate mind map.");
      const data = await res.json();
      setMindMapData(data.mindMap);

      await saveStudioDataToDb({ mindMapData: data.mindMap });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate mind map.");
    } finally {
      setLoadingContent(false);
    }
  };

  const downloadMindMapPng = () => {
    const wrapperElement = document.getElementById("reactflow-wrapper");
    if (!wrapperElement) {
      toast.error("Mind map element not found.");
      return;
    }

    const controls = wrapperElement.querySelector(".react-flow__controls") as HTMLElement | null;
    if (controls) controls.style.display = "none";

    toast.promise(
      toPng(wrapperElement, {
        backgroundColor: "#f9f7f4",
        quality: 1.0,
        pixelRatio: 2,
        style: {
          transform: "scale(1)",
        },
      }).then((dataUrl) => {
        if (controls) controls.style.display = "flex";
        
        const downloadLink = document.createElement("a");
        downloadLink.href = dataUrl;
        downloadLink.download = `${(selectedDoc?.name || "mindmap").replace(/\.[^/.]+$/, "")}-mindmap.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }),
      {
        loading: "Generating professional mind map image...",
        success: "Mind Map exported successfully!",
        error: (err) => {
          if (controls) controls.style.display = "flex";
          console.error("Export failed:", err);
          return "Failed to export mind map as PNG.";
        }
      }
    );
  };

  const downloadMindMapMarkdown = () => {
    if (!mindMapData) {
      toast.error("Mind map data not found.");
      return;
    }

    const convertToMarkdown = (node: MindMapNode, depth: number = 0): string => {
      const indent = "  ".repeat(depth);
      let md = `${indent}- ${node.name}\n`;
      if (node.children) {
        for (const child of node.children) {
          md += convertToMarkdown(child, depth + 1);
        }
      }
      return md;
    };

    try {
      const markdownContent = `# Mind Map Outline: ${selectedDoc?.name || "Mind Map"}\n\n${convertToMarkdown(mindMapData)}`;
      const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `${(selectedDoc?.name || "mindmap").replace(/\.[^/.]+$/, "")}-mindmap.md`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success("Mind Map exported as Markdown!");
    } catch (err) {
      console.error(err);
      toast.error("Export to Markdown failed.");
    }
  };

  const generateQuizzes = async () => {
    if (!selectedDoc) return;
    setLoadingContent(true);
    try {
      const res = await fetch("/api/studio/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentName: selectedDoc.name,
          documentText: selectedDoc.text || "",
        }),
      });
      if (!res.ok) throw new Error("Failed to generate study materials.");
      const data = await res.json();
      setStudyData(data.studyData);
      setQuizAnswers({});
      setQuizSubmitted({});

      await saveStudioDataToDb({ studyData: data.studyData });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate study aids.");
    } finally {
      setLoadingContent(false);
    }
  };

  const handleSrsRate = (rating: "easy" | "good" | "hard") => {
    setSrsRatings(prev => ({ ...prev, [currentCardIdx]: rating }));
    setIsFlipped(false);
    
    setTimeout(() => {
      if (studyData && currentCardIdx < studyData.flashcards.length - 1) {
        setCurrentCardIdx(prev => prev + 1);
      } else {
        setShowSrsRecap(true);
      }
    }, 200);
  };

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const InteractiveMindMapVisualizer = ({ data }: { data: MindMapNode }) => {
    const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState("");

    const updateNodeNameByPath = (path: string, newName: string) => {
      if (!mindMapData) return;
      const clone = JSON.parse(JSON.stringify(mindMapData));
      const pathIndices = path.split("-").slice(1).map(Number);

      let current = clone;
      for (const idx of pathIndices) {
        if (current.children && current.children[idx]) {
          current = current.children[idx];
        }
      }
      current.name = newName;
      setMindMapData(clone);
      saveStudioDataToDb({ mindMapData: clone });
    };

    const addSubNodeByPath = (path: string) => {
      if (!mindMapData) return;
      const clone = JSON.parse(JSON.stringify(mindMapData));
      const pathIndices = path.split("-").slice(1).map(Number);

      let current = clone;
      for (const idx of pathIndices) {
        if (current.children && current.children[idx]) {
          current = current.children[idx];
        }
      }
      if (!current.children) current.children = [];
      current.children.push({ name: "New Concept", children: [] });
      setMindMapData(clone);
      saveStudioDataToDb({ mindMapData: clone });
      toast.success("Added sub-concept node!");
    };

    const deleteNodeByPath = (path: string) => {
      if (!mindMapData || path === "root") return;
      const clone = JSON.parse(JSON.stringify(mindMapData));
      const pathIndices = path.split("-").slice(1).map(Number);
      
      let current = clone;
      const parentIndices = pathIndices.slice(0, -1);
      const targetIdx = pathIndices[pathIndices.length - 1];

      for (const idx of parentIndices) {
        if (current.children && current.children[idx]) {
          current = current.children[idx];
        }
      }
      
      if (current.children) {
        current.children.splice(targetIdx, 1);
      }
      setMindMapData(clone);
      saveStudioDataToDb({ mindMapData: clone });
      if (selectedNodePath === path) {
        setSelectedNodePath(null);
      }
      toast.success("Deleted concept node!");
    };

    const handleSaveEdit = (path: string) => {
      if (editingValue.trim()) {
        updateNodeNameByPath(path, editingValue.trim());
      }
      setEditingNodeId(null);
    };

    const { rfNodes, rfEdges } = useMemo(() => {
      const nodes: any[] = [];
      const edges: any[] = [];
      let nextY = 40;
      const ySpacing = 80;
      const xSpacing = 260;

      const traverse = (n: MindMapNode, currentDepth: number, parentId: string | null, path: string) => {
        const id = path;
        const isCollapsed = collapsedNodes[id] !== undefined ? collapsedNodes[id] : (currentDepth >= 1);
        const hasChildren = Boolean(n.children && n.children.length > 0);
        const x = currentDepth * xSpacing + 40;
        let y = 0;

        if (!hasChildren || isCollapsed) {
          y = nextY;
          nextY += ySpacing;
        } else {
          const childrenY: number[] = [];
          n.children!.forEach((child, idx) => {
            const childPath = `${path}-${idx}`;
            const childRes = traverse(child, currentDepth + 1, id, childPath);
            childrenY.push(childRes.y);
          });
          if (childrenY.length > 0) {
            y = (childrenY[0] + childrenY[childrenY.length - 1]) / 2;
          } else {
            y = nextY;
            nextY += ySpacing;
          }
        }

        nodes.push({
          id,
          type: "mindMapNode",
          position: { x, y },
          data: {
            id,
            name: n.name,
            depth: currentDepth,
            parentId,
            hasChildren,
            isCollapsed,
            isSelected: selectedNodePath === id,
            editingNodeId,
            editingValue,
            setEditingValue,
            onStartEdit: (id: string, name: string) => {
              setEditingNodeId(id);
              setEditingValue(name);
            },
            onSaveEdit: handleSaveEdit,
            onCancelEdit: () => setEditingNodeId(null),
            onSelectNode: (id: string) => {
              setSelectedNodePath(id === selectedNodePath ? null : id);
            },
            onAddSubNode: addSubNodeByPath,
            onDeleteNode: deleteNodeByPath,
            onToggleCollapse: (id: string) => {
              setCollapsedNodes(prev => {
                const isCurrentlyCollapsed = prev[id] !== undefined ? prev[id] : (id !== "root");
                return {
                  ...prev,
                  [id]: !isCurrentlyCollapsed,
                };
              });
            }
          },
        });

        if (parentId) {
          edges.push({
            id: `edge-${parentId}-${id}`,
            source: parentId,
            target: id,
            type: "smoothstep",
            animated: selectedNodePath && selectedNodePath.startsWith(id) && selectedNodePath.includes(parentId),
            style: {
              stroke: (selectedNodePath && selectedNodePath.startsWith(id) && selectedNodePath.includes(parentId))
                ? "#4f46e5"
                : "#eae6df",
              strokeWidth: (selectedNodePath && selectedNodePath.startsWith(id) && selectedNodePath.includes(parentId))
                ? 3.5
                : 2,
            },
          });
        }

        return { y };
      };

      traverse(data, 0, null, "root");
      return { rfNodes: nodes, rfEdges: edges };
    }, [data, collapsedNodes, selectedNodePath, editingNodeId, editingValue]);

    return (
      <div id="reactflow-wrapper" className="relative w-full border border-[#eae6df] rounded-3xl bg-[#f9f7f4]/45 overflow-hidden select-none h-125">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#ccc" gap={16} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    );
  };

  if (!isLoaded || isLoadingDoc) {
    return (
      <div className="min-h-screen bg-[#f9f7f4] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          <p className="text-sm font-bold text-foreground/60">
            Loading Studio workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!selectedDoc) return null;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-foreground flex relative overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-auto min-w-0 relative z-10">
        <audio
          ref={audioRef}
          onTimeUpdate={() => {
            if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) setDuration(audioRef.current.duration);
          }}
          onEnded={() => {
            setIsPlaying(false);
          }}
        />

        <div className="p-4 md:p-8 max-w-4xl w-full mx-auto space-y-8 md:space-y-10 mt-14 md:mt-0">
          <div className="border-b border-[#eae6df]/60 pb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-black leading-tight tracking-tight flex items-center gap-2">
                <span className="shiny-text animate-shine text-primary">
                  Studio
                </span>
              </h1>
              <p className="text-sm text-foreground/75 font-medium mt-1.5">
                Generate advanced learning materials, interactive outline maps,
                and conversational podcasts.
              </p>
            </div>

            <Button
              onClick={() => {
                router.push("/studio");
              }}
              variant="outline"
              className="rounded-xl font-bold cursor-pointer text-xs"
            >
              Change Document
            </Button>
          </div>

          {activeTool === "menu" && (
            <div className="space-y-6">
              <div className="p-5 bg-primary/5 border border-primary/10 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SelectedDocIcon className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-heading font-black text-sm text-foreground">
                      Loaded Document
                    </h4>
                    <p className="text-xs font-semibold text-primary">
                      {selectedDoc.name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <button
                  onClick={() => {
                    setActiveTool("podcast");
                    if (podcastScript.length === 0) generatePodcast();
                  }}
                  className="flex flex-col items-center text-center p-6 bg-white border border-[#eae6df] rounded-3xl hover:shadow-xl hover:shadow-primary/5 hover:border-primary/45 transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-14 w-14 rounded-2xl bg-indigo-500/8 text-indigo-600 flex items-center justify-center mb-4 shadow-inner group-hover:scale-105 transition-transform duration-300">
                    <Headphones className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading font-black text-base text-foreground mb-1.5">
                    Audio Overview
                  </h3>
                  <p className="text-xs text-foreground/50 font-semibold leading-relaxed">
                    Generate a simulated 2-host audio overview discussion between
                    Adam and Sarah.
                  </p>
                </button>

                <button
                  onClick={() => {
                    setActiveTool("mindmap");
                    if (!mindMapData) generateMindMap();
                  }}
                  className="flex flex-col items-center text-center p-6 bg-white border border-[#eae6df] rounded-3xl hover:shadow-xl hover:shadow-primary/5 hover:border-primary/45 transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/8 text-emerald-600 flex items-center justify-center mb-4 shadow-inner group-hover:scale-105 transition-transform duration-300">
                    <Network className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading font-black text-base text-foreground mb-1.5">
                    Mind Map
                  </h3>
                  <p className="text-xs text-foreground/50 font-semibold leading-relaxed">
                    Extract conceptual hierarchical branches of outline nodes to
                    visually study the document.
                  </p>
                </button>

                <button
                  onClick={() => {
                    setActiveTool("flashcards");
                    if (!studyData) generateQuizzes();
                  }}
                  className="flex flex-col items-center text-center p-6 bg-white border border-[#eae6df] rounded-3xl hover:shadow-xl hover:shadow-primary/5 hover:border-primary/45 transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-14 w-14 rounded-2xl bg-violet-500/8 text-violet-600 flex items-center justify-center mb-4 shadow-inner group-hover:scale-105 transition-transform duration-300">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading font-black text-base text-foreground mb-1.5">
                    Flashcards
                  </h3>
                  <p className="text-xs text-foreground/50 font-semibold leading-relaxed">
                    Interactive flashcard decks with flipping animations for
                    active recall learning.
                  </p>
                </button>

                <button
                  onClick={() => {
                    setActiveTool("quiz");
                    if (!studyData) generateQuizzes();
                  }}
                  className="flex flex-col items-center text-center p-6 bg-white border border-[#eae6df] rounded-3xl hover:shadow-xl hover:shadow-primary/5 hover:border-primary/45 transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-14 w-14 rounded-2xl bg-amber-500/8 text-amber-600 flex items-center justify-center mb-4 shadow-inner group-hover:scale-105 transition-transform duration-300">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading font-black text-base text-foreground mb-1.5">
                    Practice Quiz
                  </h3>
                  <p className="text-xs text-foreground/50 font-semibold leading-relaxed">
                    Test your comprehensive document knowledge with customized
                    practice quizzes.
                  </p>
                </button>
              </div>
            </div>
          )}

          {activeTool === "podcast" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleBackToMenu}
                  variant="ghost"
                  className="group rounded-xl font-bold cursor-pointer text-[11px] flex items-center gap-1.5 px-3 py-2 bg-white border border-[#eae6df] text-foreground/75 hover:text-foreground hover:bg-[#eae6df]/15 hover:border-[#eae6df]/90 active:scale-95 transition-all shadow-xs shrink-0"
                >
                  <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
                  <span>Back</span>
                </Button>
                <h3 className="font-heading font-black text-lg text-foreground">
                  Audio Overview Discussion
                </h3>
              </div>

              {loadingContent && !audioUrl ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-sm font-bold text-foreground/60 animate-pulse">
                    Synthesizing high fidelity audio discussion...
                  </p>
                </div>
              ) : podcastScript.length === 0 ? (
                <div className="text-center py-12 bg-white/40 border border-dashed border-[#eae6df] rounded-3xl">
                  <p className="text-sm text-foreground/50 font-semibold">
                    No podcast generated yet.
                  </p>
                  <Button
                    onClick={generatePodcast}
                    className="mt-4 rounded-xl font-bold"
                  >
                    Generate Podcast
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white border border-[#eae6df] rounded-3xl p-6 h-120 flex flex-col shadow-xs">
                    <h4 className="font-heading font-black text-sm text-foreground mb-4 shrink-0">
                      Discussion Transcript
                    </h4>
                    <div className="flex-1 overflow-auto space-y-4 pr-2 scrollbar-thin">
                      {podcastScript.map((line, idx) => {
                        const isSpeaking = activeSpeaker === line.speaker && isPlaying;
                        return (
                          <div
                            key={idx}
                            ref={isSpeaking ? activeLineRef : null}
                            onClick={() => handleSeek(line.start)}
                            className={cn(
                              "p-3 rounded-2xl cursor-pointer transition-all duration-300 border border-transparent",
                              isSpeaking
                                ? "bg-primary/5 border-primary/20 shadow-xs scale-[0.99]"
                                : "hover:bg-slate-50"
                            )}
                          >
                            <span
                              className={cn(
                                "text-[10px] font-black uppercase tracking-wider block mb-1",
                                line.speaker === "Adam"
                                  ? "text-indigo-600"
                                  : "text-rose-500"
                              )}
                            >
                              {line.speaker}
                            </span>
                            <p className="text-xs text-foreground/80 leading-relaxed font-semibold">
                              {line.text}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white border border-[#eae6df] rounded-3xl p-6 flex flex-col justify-between shadow-xs">
                    <div className="space-y-6">
                      <div className="text-center space-y-3">
                        <div className="h-16 w-16 bg-[#eae6df]/35 border border-[#eae6df]/55 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                          <Headphones className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-heading font-black text-sm text-foreground">
                            Adam & Sarah
                          </h4>
                          <p className="text-[10px] text-foreground/50 font-bold uppercase tracking-wider mt-0.5">
                            Conversational AI Hosts
                          </p>
                        </div>
                      </div>

                      <div className="relative h-24 bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                        <canvas ref={canvasRef} className="w-full h-full" />
                        {!isPlaying && (
                          <span className="absolute text-[10px] text-white/40 font-bold uppercase tracking-wider">
                            Visualization Idle
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-foreground/50 font-bold">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={duration || 100}
                          value={currentTime}
                          onChange={(e) => handleSeek(Number(e.target.value))}
                          className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-[#eae6df]/60 space-y-4">
                      <div className="flex items-center justify-center gap-4">
                        <Button
                          disabled={!audioUrl || loadingContent}
                          onClick={handlePlayPause}
                          className="h-12 w-12 rounded-full p-0 flex items-center justify-center cursor-pointer shadow-md"
                        >
                          {isPlaying ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5 fill-white ml-0.5" />
                          )}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-foreground/50 font-bold uppercase tracking-wider">
                          Speed
                        </span>
                        <div className="flex items-center gap-1.5">
                          {[0.75, 1, 1.25, 1.5].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => setPlaybackRate(rate)}
                              className={cn(
                                "text-[10px] font-black px-2 py-1 rounded-md transition-all cursor-pointer",
                                playbackRate === rate
                                  ? "bg-primary text-white"
                                  : "bg-[#eae6df]/35 text-foreground/75 hover:bg-[#eae6df]/60"
                              )}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTool === "mindmap" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleBackToMenu}
                    variant="ghost"
                    className="group rounded-xl font-bold cursor-pointer text-[11px] flex items-center gap-1.5 px-3 py-2 bg-white border border-[#eae6df] text-foreground/75 hover:text-foreground hover:bg-[#eae6df]/15 hover:border-[#eae6df]/90 active:scale-95 transition-all shadow-xs shrink-0"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
                    <span>Back</span>
                  </Button>
                  <h3 className="font-heading font-black text-lg text-foreground">
                    Interactive Mind Map
                  </h3>
                </div>
                {mindMapData && (
                  <div className="flex gap-2">
                    <Button
                      onClick={downloadMindMapPng}
                      className="rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-primary text-white hover:bg-primary/95 shadow-xs"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export PNG (.png)</span>
                    </Button>
                  </div>
                )}
              </div>

              {loadingContent ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-sm font-bold text-foreground/60 animate-pulse">
                    Structuring conceptual mapping...
                  </p>
                </div>
              ) : !mindMapData ? (
                <div className="text-center py-12 bg-white/40 border border-dashed border-[#eae6df] rounded-3xl">
                  <p className="text-sm text-foreground/50 font-semibold">
                    No mind map generated yet.
                  </p>
                  <Button
                    onClick={generateMindMap}
                    className="mt-4 rounded-xl font-bold"
                  >
                    Generate Mind Map
                  </Button>
                </div>
              ) : (
                <InteractiveMindMapVisualizer data={mindMapData} />
              )}
            </div>
          )}

          {activeTool === "flashcards" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleBackToMenu}
                  variant="ghost"
                  className="group rounded-xl font-bold cursor-pointer text-[11px] flex items-center gap-1.5 px-3 py-2 bg-white border border-[#eae6df] text-foreground/75 hover:text-foreground hover:bg-[#eae6df]/15 hover:border-[#eae6df]/90 active:scale-95 transition-all shadow-xs shrink-0"
                >
                  <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
                  <span>Back</span>
                </Button>
                <h3 className="font-heading font-black text-lg text-foreground">
                  Interactive Flashcards
                </h3>
              </div>

              {loadingContent ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-sm font-bold text-foreground/60 animate-pulse">
                    Designing study aids...
                  </p>
                </div>
              ) : !studyData ? (
                <div className="text-center py-12 bg-white/40 border border-dashed border-[#eae6df] rounded-3xl">
                  <p className="text-sm text-foreground/50 font-semibold">
                    No study data generated yet.
                  </p>
                  <Button
                    onClick={generateQuizzes}
                    className="mt-4 rounded-xl font-bold"
                  >
                    Generate Flashcards
                  </Button>
                </div>
              ) : showSrsRecap ? (
                <div className="max-w-md w-full bg-white border border-[#eae6df] rounded-3xl p-8 text-center space-y-6 shadow-xs mx-auto animate-in fade-in duration-300">
                  <div className="flex justify-center pt-2">
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100/50">
                      <Icons.BookOpen className="h-10 w-10 text-indigo-600" />
                    </div>
                  </div>
                  <h4 className="font-heading font-black text-xl text-foreground">
                    Session Recap
                  </h4>
                  <p className="text-xs text-foreground/50 font-semibold">
                    You've reviewed all flashcards in this deck! Here is your spaced repetition breakdown:
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                      <span className="text-2xl block">🟢</span>
                      <span className="font-black text-lg text-emerald-700 block mt-1">
                        {Object.values(srsRatings).filter(v => v === "easy").length}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Easy</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                      <span className="text-2xl block">🟡</span>
                      <span className="font-black text-lg text-amber-700 block mt-1">
                        {Object.values(srsRatings).filter(v => v === "good").length}
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Good</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                      <span className="text-2xl block">🔴</span>
                      <span className="font-black text-lg text-red-700 block mt-1">
                        {Object.values(srsRatings).filter(v => v === "hard").length}
                      </span>
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Hard</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={() => {
                        setCurrentCardIdx(0);
                        setIsFlipped(false);
                        setSrsRatings({});
                        setShowSrsRecap(false);
                      }}
                      className="w-full rounded-2xl font-bold py-3 cursor-pointer"
                    >
                      Restart Session
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-6 animate-in fade-in duration-300">
                  <div className="relative w-full max-w-md h-72">
                    <div
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="w-full h-full cursor-pointer relative z-20"
                      style={{ perspective: "1000px" }}
                    >
                      <motion.div
                        className="w-full h-full relative"
                        style={{ transformStyle: "preserve-3d" }}
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <div
                          className="absolute inset-0 bg-white border border-[#eae6df] rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-[0_10px_35px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_35px_rgba(79,70,229,0.06)] hover:border-[#4f46e5]/30 transition-all duration-300"
                          style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                          }}
                        >
                          <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 mb-6 block">
                            Question {currentCardIdx + 1} of {studyData.flashcards.length}
                          </span>
                          <p className="text-base font-bold text-slate-800 max-w-[90%] leading-relaxed">
                            {studyData.flashcards[currentCardIdx].question}
                          </p>
                          <span className="text-[9px] font-bold text-slate-400 uppercase mt-8 tracking-wider bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100/60 block">
                            Click to Flip
                          </span>
                        </div>

                        <div
                          className="absolute inset-0 bg-linear-to-br from-[#f8fafc] to-[#f1f5f9] border border-indigo-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-[0_10px_35px_rgba(0,0,0,0.04)]"
                          style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                          }}
                        >
                          <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100/50 mb-6 block">
                            Answer {currentCardIdx + 1}
                          </span>
                          <p className="text-[13px] font-medium text-slate-700 leading-relaxed max-w-[90%]">
                            {studyData.flashcards[currentCardIdx].answer}
                          </p>
                          <span className="text-[9px] font-bold text-indigo-400 uppercase mt-8 tracking-wider bg-indigo-50/50 px-2.5 py-1 rounded-lg border border-indigo-100/30 block">
                            Click to Flip
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {isFlipped && (
                    <div className="flex gap-3 justify-center w-full max-w-md animate-in fade-in duration-300 relative z-30">
                      <Button
                        onClick={() => handleSrsRate("hard")}
                        className="flex-1 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black text-xs cursor-pointer py-3"
                      >
                        Hard 🔴 (1)
                      </Button>
                      <Button
                        onClick={() => handleSrsRate("good")}
                        className="flex-1 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 font-black text-xs cursor-pointer py-3"
                      >
                        Good 🟡 (2)
                      </Button>
                      <Button
                        onClick={() => handleSrsRate("easy")}
                        className="flex-1 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 font-black text-xs cursor-pointer py-3"
                      >
                        Easy 🟢 (3)
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-4">
                      <Button
                        disabled={currentCardIdx === 0}
                        onClick={() => {
                          setIsFlipped(false);
                          setTimeout(() => setCurrentCardIdx(prev => prev - 1), 150);
                        }}
                        variant="outline"
                        className="h-8 w-8 rounded-xl p-0 flex items-center justify-center cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs font-bold text-foreground/60 select-none">
                        {currentCardIdx + 1} / {studyData.flashcards.length}
                      </span>
                      <Button
                        disabled={currentCardIdx === studyData.flashcards.length - 1}
                        onClick={() => {
                          setIsFlipped(false);
                          setTimeout(() => setCurrentCardIdx(prev => prev + 1), 150);
                        }}
                        variant="outline"
                        className="h-8 w-8 rounded-xl p-0 flex items-center justify-center cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-[10px] text-foreground/30 font-bold uppercase tracking-wider text-center max-w-55 select-none leading-relaxed">
                      SPACE: FLIP • ← / →: NAVIGATE • 1, 2, 3: RATE DIFFICULTY
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTool === "quiz" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleBackToMenu}
                  variant="ghost"
                  className="group rounded-xl font-bold cursor-pointer text-[11px] flex items-center gap-1.5 px-3 py-2 bg-white border border-[#eae6df] text-foreground/75 hover:text-foreground hover:bg-[#eae6df]/15 hover:border-[#eae6df]/90 active:scale-95 transition-all shadow-xs shrink-0"
                >
                  <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
                  <span>Back</span>
                </Button>
                <h3 className="font-heading font-black text-lg text-foreground">
                  Practice Quiz
                </h3>
              </div>

              {loadingContent ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-sm font-bold text-foreground/60 animate-pulse">
                    Designing study aids...
                  </p>
                </div>
              ) : !studyData ? (
                <div className="text-center py-12 bg-white/40 border border-dashed border-[#eae6df] rounded-3xl">
                  <p className="text-sm text-foreground/50 font-semibold">
                    No study data generated yet.
                  </p>
                  <Button
                    onClick={generateQuizzes}
                    className="mt-4 rounded-xl font-bold"
                  >
                    Generate Quiz
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const totalQuizQuestions = studyData.quiz.length;
                    const answeredIndices = Object.keys(quizSubmitted).map(Number);
                    const submittedCount = answeredIndices.length;
                    const isQuizComplete = totalQuizQuestions > 0 && submittedCount === totalQuizQuestions;
                    
                    const correctCount = studyData.quiz.reduce((acc, q, idx) => {
                      return acc + (quizSubmitted[idx] && quizAnswers[idx] === q.correctOption ? 1 : 0);
                    }, 0);
                    const scorePercentage = totalQuizQuestions > 0 ? Math.round((correctCount / totalQuizQuestions) * 100) : 0;

                    const minutes = Math.floor(quizElapsedTime / 60);
                    const seconds = quizElapsedTime % 60;
                    const timeFormatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

                    if (isQuizComplete) {
                      return (
                        <div className="bg-white border border-[#eae6df] rounded-3xl p-8 text-center space-y-6 shadow-xs max-w-xl mx-auto animate-in fade-in duration-300">
                          <div className="flex justify-center pt-2">
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                              <Icons.Trophy className="h-10 w-10 text-amber-500 fill-amber-500/20" />
                            </div>
                          </div>
                          <h4 className="font-heading font-black text-xl text-foreground">
                            Quiz Completed!
                          </h4>
                          
                          <div className="relative h-36 w-36 mx-auto flex items-center justify-center bg-slate-50/50 rounded-full p-2 border border-slate-100">
                            <svg className="absolute inset-0 h-full w-full -rotate-90">
                              <defs>
                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#4f46e5" />
                                  <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                              </defs>
                              <circle cx="72" cy="72" r="58" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                              <circle cx="72" cy="72" r="58" stroke="url(#scoreGradient)" strokeWidth="10" fill="transparent"
                                      strokeDasharray={2 * Math.PI * 58}
                                      strokeDashoffset={2 * Math.PI * 58 * (1 - scorePercentage / 100)}
                                      strokeLinecap="round"
                              />
                            </svg>
                            <div className="text-center z-10 bg-white h-24 w-24 rounded-full flex flex-col items-center justify-center shadow-xs border border-slate-100">
                              <span className="font-black text-3xl text-slate-800 tracking-tight block">{scorePercentage}%</span>
                              <span className="text-[9px] text-indigo-600/75 font-bold uppercase tracking-widest mt-0.5">Score</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3 pt-2">
                            <div className="p-3.5 bg-slate-50 border border-[#eae6df]/75 rounded-2xl">
                              <span className="text-[10px] font-bold text-foreground/40 uppercase block">Accuracy</span>
                              <span className="font-heading font-black text-sm text-foreground block mt-1">
                                {correctCount} / {totalQuizQuestions}
                              </span>
                            </div>

                            <div className="p-3.5 bg-slate-50 border border-[#eae6df]/75 rounded-2xl">
                              <span className="text-[10px] font-bold text-foreground/40 uppercase block">Time Spent</span>
                              <span className="font-heading font-black text-sm text-foreground block mt-1">
                                {timeFormatted}
                              </span>
                            </div>

                            <div className="p-3.5 bg-slate-50 border border-[#eae6df]/75 rounded-2xl">
                              <span className="text-[10px] font-bold text-foreground/40 uppercase block">Avg Speed</span>
                              <span className="font-heading font-black text-sm text-foreground block mt-1">
                                {Math.round(quizElapsedTime / (totalQuizQuestions || 1))}s/q
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-foreground/60 font-semibold leading-relaxed">
                              {scorePercentage >= 80
                                ? "Excellent work! You have fully mastered this document's core concepts."
                                : scorePercentage >= 50
                                  ? "Good effort. Review any incorrect answers to solidify your understanding."
                                  : "Consider reading the document library again to sharpen your knowledge."}
                            </p>
                          </div>

                          <div className="pt-2 flex gap-3">
                            <Button
                              onClick={() => {
                                setQuizAnswers({});
                                setQuizSubmitted({});
                                setQuizCurrentIdx(0);
                                setQuizElapsedTime(0);
                                setQuizTimerActive(true);
                              }}
                              className="flex-1 rounded-2xl font-bold py-3 cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Icons.RotateCcw className="h-4 w-4" />
                              <span>Retake Quiz</span>
                            </Button>
                            <Button
                              onClick={handleBackToMenu}
                              variant="outline"
                              className="flex-1 bg-white text-xs border border-[#eae6df] rounded-2xl font-bold py-3 cursor-pointer text-foreground hover:bg-slate-50 flex items-center justify-center gap-1.5"
                            >
                              <Icons.Home className="h-4 w-4 text-slate-500" />
                              <span>Back to Menu</span>
                            </Button>
                          </div>
                        </div>
                      );
                    }

                    const q = studyData.quiz[quizCurrentIdx];
                    const selectedOpt = quizAnswers[quizCurrentIdx];
                    const isSub = quizSubmitted[quizCurrentIdx];

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white border border-[#eae6df] rounded-3xl p-6 flex flex-col justify-between shadow-xs">
                          <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-[#eae6df]/60 pb-4">
                              <span className="text-xs font-black uppercase text-primary tracking-wider">
                                Question {quizCurrentIdx + 1} of {totalQuizQuestions}
                              </span>
                              <div className="flex items-center gap-1.5 text-xs text-foreground/50 font-bold bg-[#eae6df]/35 px-3 py-1.5 rounded-xl border border-[#eae6df]/55">
                                <Icons.Clock className="h-3.5 w-3.5 text-primary" />
                                <span>{timeFormatted}</span>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <p className="text-sm font-black text-foreground leading-relaxed">
                                {q.question}
                              </p>

                              <div className="space-y-2.5">
                                {q.options.map((opt, oIdx) => {
                                  const isSelected = selectedOpt === oIdx;
                                  const isCorrect = q.correctOption === oIdx;
                                  
                                  let buttonStyle = "bg-white border-[#eae6df] text-foreground/80 hover:bg-slate-50 hover:border-foreground/20";
                                  if (isSub) {
                                    if (isCorrect) {
                                      buttonStyle = "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm";
                                    } else if (isSelected) {
                                      buttonStyle = "bg-red-50 border-red-300 text-red-700 shadow-sm";
                                    } else {
                                      buttonStyle = "bg-white border-[#eae6df] text-foreground/40 opacity-60";
                                    }
                                  } else if (isSelected) {
                                    buttonStyle = "bg-primary/5 border-primary text-primary shadow-xs";
                                  }

                                  return (
                                    <button
                                      key={oIdx}
                                      disabled={isSub}
                                      onClick={() => {
                                        setQuizAnswers(prev => ({ ...prev, [quizCurrentIdx]: oIdx }));
                                      }}
                                      className={cn(
                                        "w-full text-left p-4 border rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                                        buttonStyle
                                      )}
                                    >
                                      <span>{opt}</span>
                                      {isSub && isCorrect && <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 ml-3" />}
                                      {isSub && isSelected && !isCorrect && <XCircle className="h-4.5 w-4.5 text-red-600 shrink-0 ml-3" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-[#eae6df]/60 flex items-center justify-between gap-4 mt-6">
                            <Button
                              disabled={quizCurrentIdx === 0}
                              onClick={() => setQuizCurrentIdx(prev => prev - 1)}
                              variant="outline"
                              className="rounded-xl font-bold cursor-pointer text-xs flex items-center gap-1 px-4 py-2"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              <span>Previous</span>
                            </Button>

                            {!isSub ? (
                              <Button
                                disabled={selectedOpt === undefined}
                                onClick={() => {
                                  setQuizSubmitted(prev => ({ ...prev, [quizCurrentIdx]: true }));
                                }}
                                className="rounded-xl font-bold cursor-pointer text-xs px-6 py-2"
                              >
                                Submit Answer
                              </Button>
                            ) : (
                              <Button
                                onClick={() => {
                                  if (quizCurrentIdx < totalQuizQuestions - 1) {
                                    setQuizCurrentIdx(prev => prev + 1);
                                  }
                                }}
                                className="rounded-xl font-bold cursor-pointer text-xs px-6 py-2"
                              >
                                Next Question
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="bg-white border border-[#eae6df] rounded-3xl p-6 shadow-xs flex flex-col justify-between h-fit space-y-6">
                          <div className="space-y-4">
                            <h4 className="font-heading font-black text-sm text-foreground">
                              Explanation
                            </h4>
                            {isSub ? (
                              <p className="text-xs text-foreground/70 leading-relaxed font-medium">
                                {q.explanation}
                              </p>
                            ) : (
                              <p className="text-xs text-foreground/40 leading-relaxed font-semibold italic">
                                Submit your answer to see the detailed explanation.
                              </p>
                            )}
                          </div>

                          <div className="border-t border-[#eae6df]/60 pt-4">
                            <div className="flex justify-between items-center text-[10px] text-foreground/50 font-bold uppercase tracking-wider">
                              <span>Progress</span>
                              <span>
                                {submittedCount} / {totalQuizQuestions} Answered
                              </span>
                            </div>
                            <div className="w-full bg-[#eae6df]/35 h-1.5 rounded-full mt-2 overflow-hidden border border-[#eae6df]/20">
                              <div
                                className="bg-primary h-full rounded-full transition-all duration-300"
                                style={{ width: `${(submittedCount / totalQuizQuestions) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
