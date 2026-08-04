"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/helpers/utils";
import { motion } from "motion/react";
import { ArrowLeft, Home } from "lucide-react";
import { Squares } from "@/components/ui/Squares";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f9f7f4] flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
      <Squares />
      <motion.div 
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -40, 30, 0],
          scale: [1, 1.1, 0.9, 1]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 left-1/3 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none" 
      />
      <motion.div 
        animate={{
          x: [0, -30, 40, 0],
          y: [0, 30, -40, 0],
          scale: [1, 0.9, 1.1, 1]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full bg-violet-500/8 blur-[100px] pointer-events-none" 
      />

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2.5 group select-none focus-visible:outline-none">
        <Logo className="h-9 w-9 group-hover:scale-105 transition-transform" />
        <span className="font-heading font-black text-lg group-hover:text-primary transition-colors">DocMind</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="max-w-md w-full bg-white/70 backdrop-blur-md border border-[#eae6df]/80 rounded-3xl p-8 md:p-10 shadow-2xl shadow-foreground/5 flex flex-col items-center gap-6 relative z-10"
      >
        <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary relative">
          <div className="absolute inset-0 rounded-3xl bg-primary/5 opacity-60 animate-pulse" />
          <Logo className="h-11 w-11 relative z-10" />
        </div>
        
        <div className="space-y-2.5">
          <h1 className="text-6xl font-heading font-black bg-clip-text text-transparent bg-linear-to-r from-primary to-violet-600 drop-shadow-xs">
            404
          </h1>
          <h2 className="text-xl font-heading font-black text-foreground">Page not found</h2>
          <p className="text-foreground/55 text-xs font-semibold leading-relaxed max-w-[90%] mx-auto">
            The document, studio resource, or dashboard page you&apos;re looking for doesn&apos;t exist, was removed, or is private.
          </p>
        </div>

        <div className="w-full flex flex-col sm:flex-row gap-3 pt-2">
          <Button 
            onClick={() => router.back()}
            variant="outline"
            className="flex-1 bg-white border border-[#eae6df] text-foreground hover:bg-slate-50 font-bold rounded-2xl py-3 cursor-pointer flex items-center justify-center gap-2 text-xs transition-all active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Button>

          <Link 
            href="/" 
            className={cn(
              buttonVariants({ variant: "default" }),
              "flex-1 font-bold rounded-2xl py-3 cursor-pointer flex items-center justify-center gap-2 text-xs shadow-md shadow-primary/15 transition-all active:scale-95 animate-none text-white hover:text-white"
            )}
          >
            <Home className="h-4 w-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
