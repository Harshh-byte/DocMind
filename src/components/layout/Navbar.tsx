"use client";

import React, { useEffect, useRef, useState } from "react";

interface NavItem {
  label: string;
  href: string;
}

interface NavbarProps {
  logo: React.ReactNode;
  items: NavItem[];
  cta?: React.ReactNode;
}

export function Navbar({ logo, items, cta }: NavbarProps) {
  const navRef = useRef<HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      if (window.scrollY > 20) {
        nav.classList.add("shadow-sm", "bg-white/90", "backdrop-blur-md");
        nav.classList.remove("bg-transparent");
      } else {
        nav.classList.remove("shadow-sm", "bg-white/90", "backdrop-blur-md");
        nav.classList.add("bg-transparent");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const close = () => setMobileMenuOpen(false);
    window.addEventListener("scroll", close, { passive: true, once: true });
    return () => window.removeEventListener("scroll", close);
  }, [mobileMenuOpen]);

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 bg-transparent transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {logo}

        <ul className="hidden md:flex items-center gap-6 lg:gap-8">
          {items.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">{cta}</div>

        <div className="flex md:hidden items-center gap-2">
          <div className="flex items-center gap-2">{cta}</div>
          <button
            className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-foreground/70"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <span
                className={`absolute h-0.5 w-5 bg-current transform transition-all duration-300 ease-in-out ${
                  mobileMenuOpen ? "rotate-45 translate-y-0" : "-translate-y-1.5"
                }`}
              />
              <span
                className={`absolute h-0.5 w-5 bg-current transform transition-all duration-300 ease-in-out ${
                  mobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute h-0.5 w-5 bg-current transform transition-all duration-300 ease-in-out ${
                  mobileMenuOpen ? "-rotate-45 translate-y-0" : "translate-y-1.5"
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-border/50 px-4 py-3 space-y-1 shadow-lg">
          {items.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-xl text-sm font-medium text-foreground/70 hover:text-primary hover:bg-primary/5 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
