"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Logo } from "@/components/ui/Logo";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      title: "1. Agreement to Terms",
      body: "By using DocMind, you agree to comply with and be bound by these terms. If you do not agree, please do not access or upload documents to the platform.",
    },
    {
      title: "2. Use of Services",
      body: "You must not upload copyrighted materials, prohibited documents, or content that violates applicable laws. You are entirely responsible for the content you process on our platform.",
    },
    {
      title: "3. No Liability Guarantee",
      body: "DocMind is currently provided as a free tool. We offer no guarantees on service uptime, storage longevity, or continuous model completions.",
    },
    {
      title: "4. Changes to Terms",
      body: "We reserve the right to update these terms at any time. Continued use of the platform after changes constitutes your acceptance of the revised terms.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f9f7f4] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-400/4 blur-[120px] rounded-full pointer-events-none" />

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
            <h1 className="text-4xl md:text-5xl font-heading font-black text-foreground tracking-tight">Terms of Service</h1>
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
