"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Navbar } from "@/components/layout/Navbar";
import { Squares } from "@/components/ui/Squares";
import { CountUp } from "@/components/ui/CountUp";
import {
  SOCIAL_LINKS,
  FEATURES,
  STEPS,
  FAQ_ITEMS,
} from "@/lib/config/constants";
import StarBorder from "@/components/ui/StarBorder";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const stagger = {
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const perks = [
  "Semantic vector search",
  "Private isolated storage",
  "Page-level citations",
  "Streaming AI responses",
  "Markdown export",
  "Secure authentication",
];

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const handleCta = () => router.push(isSignedIn ? "/dashboard" : "/sign-up");

  return (
    <div className="relative w-full overflow-x-hidden bg-[#f9f7f4] text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      <Navbar
        logo={
          <Link
            href="/"
            className="flex items-center gap-2.5 select-none group focus-visible:outline-none"
          >
            <Logo className="h-9 w-9 group-hover:scale-105 transition-transform" />
            <span className="font-heading font-black text-lg tracking-tight group-hover:text-primary transition-colors">
              DocMind
            </span>
          </Link>
        }
        items={[
          { label: "Features", href: "#features" },
          { label: "How It Works", href: "#how-it-works" },
          { label: "FAQs", href: "#faq" },
        ]}
        cta={
          isLoaded ? (
            isSignedIn ? (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => router.push("/dashboard")}
                  size="sm"
                  className="rounded-xl font-bold"
                >
                  Dashboard
                </Button>
                <UserButton />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/sign-in"
                  className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Button
                  onClick={handleCta}
                  size="sm"
                  className="rounded-xl font-bold shadow-xs"
                >
                  Get Started
                </Button>
              </div>
            )
          ) : null
        }
      />

      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-16 pb-24 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/8 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-violet-400/8 blur-[100px] pointer-events-none" />

        <Squares />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-4xl space-y-7"
        >
          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-6xl lg:text-8xl font-heading font-black tracking-tight leading-[1.05] text-foreground"
          >
            Turn Static Files Into{" "}
            <span className="relative inline-block">
              <span className="text-primary">Active Partners</span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
              >
                <path
                  d="M2 10 Q 75 2, 150 6 Q 225 10, 298 4"
                  stroke="#4f46e5"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.4"
                />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-base sm:text-xl text-foreground/60 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            Upload PDFs, index semantic vectors, and stream context-rich answers
            powered by advanced AI — all inside your own private, secure vault.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center items-center"
          >
            <Button
              onClick={handleCta}
              size="lg"
              className="px-6 sm:px-8 rounded-2xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 w-full sm:w-auto cursor-pointer"
            >
              <span>{isSignedIn ? "Launch Dashboard" : "Start for Free"}</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>

            <StarBorder
              as="a"
              href="#features"
              color="var(--primary)"
              speed="5s"
              thickness={2}
              className="w-full sm:w-auto inline-block cursor-pointer"
            >
              See Features
            </StarBorder>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-2"
          >
            {perks.slice(0, 4).map((p) => (
              <span
                key={p}
                className="flex items-center gap-1.5 text-xs sm:text-sm text-foreground/60 font-medium"
              >
                <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                {p}
              </span>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-8 flex flex-col items-center gap-1 text-foreground/30 pointer-events-none"
        >
          <span className="text-[10px] tracking-widest uppercase font-bold">
            Scroll
          </span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </motion.div>
      </section>

      <section className="py-10 md:py-16 border-y border-border/50 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {[
            {
              value: <CountUp to={11} suffix="k+" />,
              label: "Documents Indexed",
            },
            { value: <CountUp to={99} suffix="%" />, label: "Uptime" },
            { value: "<2s", label: "Average Retrieval" },
            { value: "Free", label: "To Get Started" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center gap-1"
            >
              <span className="text-2xl md:text-3xl font-heading font-black text-primary">
                {stat.value}
              </span>
              <span className="text-xs md:text-sm text-foreground/50 font-medium">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      <section
        id="features"
        className="py-16 md:py-28 px-4 sm:px-6 bg-[#f9f7f4]"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-20"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-black tracking-tight">
              Powering Intelligent Workflows
            </h2>
            <p className="mt-3 text-foreground/60 text-base md:text-lg max-w-xl mx-auto font-medium">
              Everything required to transform raw enterprise files into
              organized, searchable knowledge.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white border border-border/60 rounded-2xl md:rounded-3xl p-5 md:p-8 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/4 blur-2xl pointer-events-none group-hover:bg-primary/8 transition-colors" />
                <div className="flex items-start gap-4 md:gap-5">
                  <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-2xs">
                    <feat.icon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-heading font-bold text-base md:text-xl">
                        {feat.title}
                      </h3>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                        {feat.badge}
                      </span>
                    </div>
                    <p className="text-foreground/60 leading-relaxed text-xs md:text-sm font-medium">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="py-16 md:py-28 px-4 sm:px-6 bg-white border-y border-border/50"
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-20"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-black tracking-tight">
              Simple 3-Step Pipeline
            </h2>
            <p className="mt-3 text-foreground/60 text-base md:text-lg max-w-xl mx-auto font-medium">
              From PDF to intelligent knowledge partner in minutes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-8 relative">
            <div className="hidden sm:block absolute top-7 left-[calc(16.66%)] right-[calc(16.66%)] h-px bg-linear-to-r from-primary/20 via-primary/50 to-primary/20 z-0" />

            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center text-center gap-4"
              >
                <div className="relative z-10 h-14 w-14 rounded-2xl bg-white border border-border/80 text-primary hover:border-primary/40 hover:scale-105 transition-all duration-300 shadow-md shadow-primary/5 flex items-center justify-center">
                  <step.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base md:text-lg">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-foreground/50 mt-1 font-medium">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="pt-24 pb-16 px-6 bg-white border-t border-border/50"
      >
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-heading font-black tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-foreground/60 font-medium">
              Everything you need to know to get started.
            </p>
          </motion.div>

          <Accordion type="single" collapsible className="space-y-3">
            {FAQ_ITEMS.map((faq, i) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <AccordionItem
                  value={faq.id}
                  className="bg-[#f9f7f4] border border-border/60 rounded-2xl px-6 border-b-border/60!"
                >
                  <AccordionTrigger className="text-sm sm:text-base font-semibold hover:text-primary hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm text-foreground/60 leading-relaxed font-medium">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </section>

      <footer className="border-t border-border/50 py-14 bg-[#f9f7f4]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Logo className="h-9 w-9" />
                <span className="font-heading font-black text-xl">DocMind</span>
              </div>
              <p className="text-xs sm:text-sm text-foreground/50 max-w-xs leading-relaxed font-medium">
                A premium, secure document intelligence platform powered by
                advanced AI.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-foreground/40">
                Navigate
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-foreground/60 font-semibold">
                {["Features", "How It Works", "FAQ"].map((l) => (
                  <li key={l}>
                    <a
                      href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                      className="hover:text-primary transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-foreground/40">
                Tools
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-foreground/60 font-semibold">
                <li>
                  <Link
                    href="/upload"
                    className="hover:text-primary transition-colors"
                  >
                    Upload Hub
                  </Link>
                </li>
                <li>
                  <Link
                    href="/chat"
                    className="hover:text-primary transition-colors"
                  >
                    Chat Engine
                  </Link>
                </li>
                <li>
                  <Link
                    href="/documents"
                    className="hover:text-primary transition-colors"
                  >
                    Document Vault
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-foreground/40">
                Legal
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-foreground/60 font-semibold">
                <li>
                  <Link
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-foreground/40 font-medium">
              © {new Date().getFullYear()} DocMind. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a
                href={SOCIAL_LINKS.twitter}
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter"
                className="text-foreground/40 hover:text-primary transition-colors flex items-center justify-center h-5 w-5"
              >
                <svg
                  className="h-4.5 w-4.5"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z" />
                </svg>
              </a>
              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="text-foreground/40 hover:text-primary transition-colors flex items-center justify-center h-5 w-5"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z" />
                </svg>
              </a>
              <a
                href={SOCIAL_LINKS.github}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="text-foreground/40 hover:text-primary transition-colors flex items-center justify-center h-5 w-5"
              >
                <svg
                  className="h-4.5 w-4.5"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
