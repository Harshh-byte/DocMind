"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { WandSparkles, BotMessageSquare, Library, Menu, X, UploadCloud, ChevronLeft, ChevronRight, Vault } from "lucide-react";
import { cn } from "@/lib/helpers/utils";
import { Logo } from "@/components/ui/Logo";

const navItems = [
  { href: "/dashboard", icon: Library, label: "Library" },
  { href: "/upload", icon: UploadCloud, label: "Upload" },
  { href: "/chat", icon: BotMessageSquare, label: "Chat Assistant" },
  { href: "/documents", icon: Vault, label: "Vault" },
  { href: "/studio", icon: WandSparkles, label: "Studio" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderSidebarContent = (collapsed: boolean) => (
    <>
      <div className={cn("h-14 px-4 border-b border-[#eae6df] flex items-center justify-between md:h-auto md:p-6", collapsed && "p-4 justify-center")}>
        <Link
          href="/"
          className="flex items-center gap-2.5 select-none group"
          onClick={() => setMobileOpen(false)}
        >
          <div className="relative">
            <Logo className="h-9 w-9 group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
          </div>
          {!collapsed && (
            <span className="font-heading font-black text-xl tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
              DocMind
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            className="md:hidden p-2 rounded-xl hover:bg-black/5 text-foreground/60 transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className={cn("flex-1 px-4 py-6 space-y-1.5", collapsed && "px-2")}>
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center transition-all duration-200 relative overflow-hidden",
                collapsed
                  ? "justify-center w-12 h-12 mx-auto rounded-2xl"
                  : "gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium",
                isActive
                  ? "bg-white text-primary shadow-[0_4px_20px_rgba(79,70,229,0.08)] border border-[#4f46e5]/10 font-semibold"
                  : "text-foreground/65 hover:text-foreground hover:bg-white/50 border border-transparent"
              )}
              title={collapsed ? label : undefined}
            >
              {isActive && (
                <div className={cn("absolute bg-primary rounded-r-full", collapsed ? "left-0 top-2.5 bottom-2.5 w-1" : "left-0 top-3 bottom-3 w-1")} />
              )}
              <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive ? "text-primary" : "text-foreground/45 group-hover:text-foreground/75")} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      <aside className={cn("hidden md:flex shrink-0 bg-[#f3efeb]/80 backdrop-blur-md border-r border-[#eae6df] flex-col min-h-screen sticky top-0 z-30 transition-all duration-300", isCollapsed ? "w-20" : "w-64")}>
        <div className="absolute inset-0 bg-linear-to-b from-primary/1 to-transparent pointer-events-none" />
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 bg-white border border-[#eae6df] rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all text-foreground/50 hover:text-foreground cursor-pointer z-50"
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        {renderSidebarContent(isCollapsed)}
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#f3efeb]/90 backdrop-blur-md border-b border-[#eae6df] h-14 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 select-none">
          <Logo className="h-7 w-7" />
          <span className="font-heading font-black text-base text-foreground">DocMind</span>
        </Link>
        <div className="flex items-center gap-3">
          <UserButton />
          <button
            className="p-2 rounded-xl hover:bg-black/5 text-foreground/70"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 bg-[#f9f7f4] h-full flex flex-col shadow-2xl z-10 border-l border-[#eae6df]">
            {renderSidebarContent(false)}
          </aside>
        </div>
      )}
    </>
  );
}
