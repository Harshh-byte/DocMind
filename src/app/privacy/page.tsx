"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Logo } from "@/components/ui/Logo";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  const sections = [
    {
      title: "1. Data Collection",
      body: "We only collect the data necessary to provide secure authentication and document indexing. Your email is processed securely via our authentication provider and never sold.",
    },
    {
      title: "2. Document Privacy",
      body: "All documents you upload are strictly private. They are vectorized and stored in a highly secure, isolated database. DocMind does not read, share, or sell your documents to any third parties.",
    },
    {
      title: "3. AI Model Usage",
      body: "DocMind uses state-of-the-art AI models for chat and semantic search. We enforce zero-data-retention agreements, ensuring your private inputs are never used to train public models.",
    },
    {
      title: "4. Data Retention & Deletion",
      body: "You can delete your documents and account data at any time from within your dashboard. Upon deletion, all vectors and associated data are permanently removed from our systems.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f9f7f4] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-violet-400/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/4 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-3xl mx-auto px-6 py-20 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-12 group select-none">
          <Logo className="h-9 w-9 group-hover:scale-105 transition-transform" />
          <span className="font-heading font-black text-lg group-hover:text-primary transition-colors">DocMind</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white border border-border/60 rounded-3xl p-10 md:p-14 shadow-lg shadow-foreground/4"
        >
          <div className="border-b border-border/50 pb-8 mb-10">
            <h1 className="text-4xl md:text-5xl font-heading font-black text-foreground tracking-tight">Privacy Policy</h1>
            <p className="mt-3 text-foreground/50 text-sm">Last updated: July 2026</p>
          </div>

          <div className="space-y-10">
            {sections.map((s, idx) => (
              <motion.section
                key={s.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 + 0.2 }}
                className="space-y-3"
              >
                <h2 className="text-xl font-heading font-bold text-foreground">{s.title}</h2>
                <p className="text-foreground/60 leading-relaxed text-sm md:text-base">{s.body}</p>
              </motion.section>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-border/50">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#eae6df] hover:bg-slate-50 text-foreground font-bold text-xs rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
