"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser, useAuth } from "@clerk/nextjs";
import {
  WandSparkles,
  BotMessageSquare,
  Library,
  Menu,
  X,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Vault,
  HardDrive,
  Home,
} from "lucide-react";
import { cn } from "@/lib/helpers/utils";
import { Logo } from "@/components/ui/Logo";
import { getSupabaseClient } from "@/lib/db/supabase";

const navItems = [
  { href: "/dashboard", icon: Library, label: "Library" },
  { href: "/upload", icon: UploadCloud, label: "Upload & Synthesize" },
  { href: "/chat", icon: BotMessageSquare, label: "Chat Assistant" },
  { href: "/studio", icon: WandSparkles, label: "Studio Hub" },
  { href: "/documents", icon: Vault, label: "Vault Storage" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { userId, isLoaded, getToken } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [usedBytes, setUsedBytes] = useState(0);

  useEffect(() => {
    if (!isLoaded || !userId) return;

    const fetchStorageUsage = async () => {
      try {
        let token = null;
        try {
          token = await getToken({ template: "Supabase" });
        } catch (authErr) {
          console.warn("Clerk token error in sidebar:", authErr);
        }
        const supabaseClient = getSupabaseClient(token || "");
        const { data } = await supabaseClient
          .from("documents")
          .select("raw_size")
          .eq("user_id", userId);

        if (data) {
          const total = data.reduce(
            (sum: number, doc: any) => sum + (doc.raw_size || 0),
            0
          );
          setUsedBytes(total);
        }
      } catch (err) {
        console.error("Failed to load storage status in sidebar:", err);
      }
    };

    fetchStorageUsage();
  }, [userId, isLoaded, getToken, pathname]);

  const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
  const percent = Math.min(
    100,
    Math.max(0, (usedBytes / (100 * 1024 * 1024)) * 100)
  );

  const renderSidebarContent = (collapsed: boolean) => (
    <div className="flex flex-col h-full bg-[#f6f3ee] text-foreground select-none justify-between overflow-hidden">
      {/* Top Section: Logo & Nav List */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div
          className={cn(
            "h-16 px-5 border-b border-[#e5e1da] flex items-center justify-between shrink-0 bg-[#ffffff]",
            collapsed && "px-3 justify-center"
          )}
        >
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-none"
            onClick={() => setMobileOpen(false)}
          >
            <div className="relative shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-br from-primary/10 to-violet-500/10 border border-primary/20 group-hover:scale-105 transition-all duration-300">
              <Logo className="h-6 w-6" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-heading font-black text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
                  DocMind
                </span>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-neutral-200/60 text-foreground/60 transition-colors"
              onClick={() => setMobileOpen(false)}
              aria-label="Close Sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-1.5">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive =
              pathname === href ||
              (href !== "/" && pathname.startsWith(href + "/"));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group relative flex items-center transition-all duration-200 font-medium text-sm rounded-xl overflow-hidden",
                  collapsed
                    ? "justify-center w-11 h-11 mx-auto"
                    : "gap-3 px-3.5 py-2.5",
                  isActive
                    ? "bg-white text-primary shadow-[0_2px_12px_rgba(79,70,229,0.08)] border border-primary/20 font-semibold"
                    : "text-foreground/70 hover:text-foreground hover:bg-white/70 border border-transparent"
                )}
                title={collapsed ? label : undefined}
              >
                {isActive && (
                  <div
                    className={cn(
                      "absolute bg-primary rounded-r-full transition-all",
                      collapsed
                        ? "left-0 top-2 bottom-2 w-1"
                        : "left-0 top-2.5 bottom-2.5 w-1.5"
                    )}
                  />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isActive
                      ? "text-primary"
                      : "text-foreground/50 group-hover:text-foreground/80"
                  )}
                />
                {!collapsed && (
                  <span className="flex-1 truncate">{label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Storage Meter & User Profile Footer */}
      {!collapsed ? (
        <div className="p-3 border-t border-[#e5e1da] bg-[#ffffff] space-y-3 shrink-0">
          {/* Dynamic Storage Meter Card */}
          <div className="p-3 rounded-xl bg-[#faf8f5] border border-[#e5e1da] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground/80 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-primary" /> Cloud Storage
              </span>
              <span className="text-[11px] font-bold text-primary">Active</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-primary to-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-[10px] text-foreground/55 font-medium flex justify-between">
              <span>Vectorized Storage</span>
              <span>
                {usedBytes === 0 ? "0 MB" : `${usedMB} MB`} / 100 MB
              </span>
            </p>
          </div>

          {/* User Button Info */}
          <div className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-neutral-100 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <UserButton />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-foreground truncate">
                  {user?.fullName || user?.firstName || "Account"}
                </span>
                <span className="text-[10px] text-foreground/50 truncate">
                  {user?.primaryEmailAddress?.emailAddress || "Pro Plan"}
                </span>
              </div>
            </div>
            <Link
              href="/"
              className="p-1.5 text-foreground/40 hover:text-primary transition-colors rounded-lg hover:bg-neutral-200/50"
              title="Return Home"
            >
              <Home className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-[#e5e1da] bg-[#ffffff] flex flex-col items-center gap-3 shrink-0">
          <UserButton />
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex shrink-0 bg-[#f6f3ee] border-r border-[#e5e1da] flex-col h-screen sticky top-0 z-30 transition-all duration-300 shadow-[2px_0_10px_rgba(0,0,0,0.02)]",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-8 h-7 w-7 bg-white border border-[#e5e1da] rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all text-foreground/60 hover:text-primary cursor-pointer z-50"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        {renderSidebarContent(isCollapsed)}
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#ffffff] border-b border-[#e5e1da] h-14 flex items-center justify-between px-4 shadow-xs">
        <Link href="/" className="flex items-center gap-2.5 select-none">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Logo className="h-5 w-5" />
          </div>
          <span className="font-heading font-black text-base text-foreground">
            DocMind
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <UserButton />
          <button
            className="p-2 rounded-xl bg-neutral-100 text-foreground/70 hover:bg-neutral-200 transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-start">
          <div
            className="absolute inset-0 bg-black/50 transition-opacity duration-300"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-80 bg-[#f6f3ee] h-full flex flex-col shadow-2xl z-10 border-r border-[#e5e1da] overflow-hidden">
            {renderSidebarContent(false)}
          </aside>
        </div>
      )}
    </>
  );
}
