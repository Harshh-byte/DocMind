"use client";

import { SignUp } from "@clerk/nextjs";
import { motion } from "motion/react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#f9f7f4] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-400/6 blur-[120px] pointer-events-none" />

      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center gap-2 group select-none"
      >
        <Logo className="h-8 w-8 group-hover:scale-105 transition-transform" />
        <span className="font-heading font-black text-lg tracking-tight group-hover:text-primary transition-colors">
          DocMind
        </span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full flex flex-col items-center gap-6"
      >
        <div className="text-center">
          <h1 className="text-2xl font-heading font-black">
            Create your account
          </h1>
          <p className="text-foreground/55 text-sm mt-1">
            Start indexing your documents for free
          </p>
        </div>

        <SignUp
          appearance={{
            variables: {
              colorPrimary: "#4f46e5",
              colorBackground: "#ffffff",
              borderRadius: "0.75rem",
              fontFamily: "Inter, sans-serif",
            },
            elements: {
              rootBox: "w-full flex justify-center",
              card: "shadow-2xl shadow-foreground/4 border border-border/50 rounded-[24px] w-full max-w-[400px]",
              headerTitle:
                "font-heading font-black text-xl tracking-tight text-foreground",
              headerSubtitle: "text-foreground/50 text-xs",
              socialButtons: "flex flex-row gap-3 w-full",
              socialButtonsBlockButton:
                "flex-1 border border-border/60 hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-200 rounded-xl py-2.5 flex items-center justify-center font-semibold text-sm text-foreground/80 shadow-sm",
              socialButtonsBlockButtonText: "font-semibold text-sm",
              formFieldLabel: "font-semibold text-xs text-foreground/75 mb-1.5",
              formFieldInput:
                "border border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl py-2 text-sm bg-white",
              formButtonPrimary:
                "bg-primary hover:bg-primary/90 text-white font-semibold text-sm rounded-xl py-2.5 shadow-md shadow-primary/10 transition-all duration-200",
              dividerLine: "bg-border/60 h-px",
              dividerText:
                "text-foreground/35 text-xs uppercase font-bold tracking-wider px-3",
              footerActionLink:
                "text-primary hover:text-primary/95 font-semibold transition-colors",
              footerActionText: "text-foreground/50 text-xs",
              devModeBanner: "hidden !hidden",
              footer: "[&>:last-child]:hidden",
            },
          }}
        />

        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70 font-medium select-none -mt-2 leading-none">
          <span className="leading-none">Secured by</span>
          <svg width="15" height="15" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 -mt-0.5">
            <path d="M99.5716 10.788C101.571 12.1272 101.742 14.9444 100.04 16.646L85.4244 31.2618C84.1035 32.5828 82.0542 32.7914 80.3915 31.9397C75.4752 29.421 69.9035 28 64 28C44.1177 28 28 44.1177 28 64C28 69.9035 29.421 75.4752 31.9397 80.3915C32.7914 82.0542 32.5828 84.1035 31.2618 85.4244L16.646 100.04C14.9444 101.742 12.1272 101.571 10.788 99.5716C3.97411 89.3989 0 77.1635 0 64C0 28.6538 28.6538 0 64 0C77.1635 0 89.3989 3.97411 99.5716 10.788Z" fill="#BAB1FF"/>
            <path d="M84 64C84 75.0457 75.0457 84 64 84C52.9543 84 44 75.0457 44 64C44 52.9543 52.9543 44 64 44C75.0457 44 84 52.9543 84 64Z" fill="#6C47FF"/>
            <path d="M100.04 111.354C101.742 113.056 101.571 115.873 99.5717 117.212C89.3989 124.026 77.1636 128 64 128C50.8364 128 38.6011 124.026 28.4283 117.212C26.4289 115.873 26.2581 113.056 27.9597 111.354L42.5755 96.7382C43.8965 95.4172 45.9457 95.2085 47.6084 96.0603C52.5248 98.579 58.0964 100 64 100C69.9036 100 75.4753 98.579 80.3916 96.0603C82.0543 95.2085 84.1036 95.4172 85.4245 96.7382L100.04 111.354Z" fill="#6C47FF"/>
          </svg>
          <span className="font-bold tracking-tight text-foreground/80 leading-none">clerk</span>
        </div>
      </motion.div>
    </div>
  );
}
