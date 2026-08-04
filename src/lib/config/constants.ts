import {
  FileText,
  Shield,
  Zap,
  MessageSquare,
  BookOpen,
  Search,
  BotMessageSquare,
} from "lucide-react";

export const SOCIAL_LINKS = {
  twitter: "https://x.com/Harshh_hb",
  linkedin: "https://www.linkedin.com/in/harsh-bhardwaj-b3791b261/",
  github: "https://github.com/Harshh-byte",
};

export const FEATURES = [
  {
    icon: FileText,
    title: "Intelligent PDF Parser",
    desc: "Upload complex multi-column articles, reports, or tables. Our pipeline extracts clean structured text without losing context.",
    badge: "Extraction",
  },
  {
    icon: Shield,
    title: "Secure Vector Storage",
    desc: "Transform paragraphs into mathematical vectors and index them inside your own isolated, private database.",
    badge: "Privacy",
  },
  {
    icon: MessageSquare,
    title: "Semantic Search & RAG",
    desc: "Search by meaning, not just exact keywords. DocMind finds the exact section needed to answer your query.",
    badge: "RAG Engine",
  },
  {
    icon: Zap,
    title: "Generative AI Chat",
    desc: "Chat directly with your documents. Get summary highlights, clear comparisons, and action items in real-time.",
    badge: "Chatbot",
  },
];

export const STEPS = [
  {
    number: "01",
    icon: BookOpen,
    title: "Upload Documents",
    desc: "Drop any PDF into your secure workspace dashboard.",
  },
  {
    number: "02",
    icon: Search,
    title: "Automatic Indexing",
    desc: "DocMind segments, embeds, and stores content in your private vector index.",
  },
  {
    number: "03",
    icon: BotMessageSquare,
    title: "Chat & Cite",
    desc: "Ask anything, get cited answers, and export full reports in seconds.",
  },
];

export const FAQ_ITEMS = [
  {
    id: "faq-1",
    question: "How secure are my uploaded documents?",
    answer: "Your security is our priority. All documents are encrypted both in transit and at rest. They are stored in isolated databases and are never used to train public LLM models.",
  },
  {
    id: "faq-2",
    question: "What file formats does DocMind support?",
    answer: "Currently, we fully support PDF files including text documents, multi-column research papers, and reports. Support for Word documents, spreadsheets, and txt files is coming soon.",
  },
  {
    id: "faq-3",
    question: "How does semantic search differ from normal search?",
    answer: "Traditional search looks for exact keyword matches. Semantic search understands the concept and intent behind your query, finding relevant answers even if different words are used.",
  },
  {
    id: "faq-4",
    question: "Is there a limit on file size or document count?",
    answer: "You can upload files up to 25MB each, with no monthly limits, restriction quotas, or premium paywalls.",
  },
  {
    id: "faq-5",
    question: "Can I generate study materials from my documents?",
    answer: "Yes! DocMind includes a Learning Studio where you can generate interactive hierarchical mind maps, flashcard study decks, practice quizzes, and even a simulated audio podcast discussion based on your document content.",
  },
  {
    id: "faq-6",
    question: "How does the Interactive Mind Map visualizer work?",
    answer: "It extracts core concepts and presents them as an animated node graph. You can click parent nodes to expand/collapse details, drag to pan, and zoom in/out to explore the content visually.",
  },
];

export const GEMINI_MODEL_LITE = "gemini-2.5-flash-lite";
export const GEMINI_MODEL_FLASH = "gemini-2.5-flash";
export const GEMINI_MODEL_LIVE = "models/gemini-2.5-flash-native-audio-preview-12-2025";
export const GEMINI_MODEL_TTS = "gemini-2.5-flash-preview-tts";

export const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export const MODELS = [
  {
    id: GEMINI_MODEL_LITE,
    name: "Quick Research",
    desc: "Fast & responsive (Recommended)",
  },
  {
    id: GEMINI_MODEL_FLASH,
    name: "Deep Research",
    desc: "Deep & analytical reasoning",
  },
];

export const VOICES = [
  {
    id: "Aoede",
    name: "Sarah",
    desc: "Breezy & clear (Default)",
  },
  {
    id: "Kore",
    name: "Jessica",
    desc: "Firm & professional",
  },
  {
    id: "Charon",
    name: "Adam",
    desc: "Deep & authoritative",
  },
  {
    id: "Fenrir",
    name: "Eric",
    desc: "Calm & informative",
  },
];
