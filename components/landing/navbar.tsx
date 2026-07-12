"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Database } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

interface NavLinkProps {
  href: string;
  label: string;
}

const navLinks: NavLinkProps[] = [
  { href: "#features", label: "Capabilities" },
  { href: "#personas", label: "Personas" },
  { href: "#architecture", label: "Architecture" },
  { href: "#metrics", label: "Metrics" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setMobileOpen(false);
      }
    }
  };

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Brand Logo switcher */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-8 w-auto flex items-center">
              <img
                src="/logo-dark-v2.png"
                alt="TransitOps"
                className="h-8 w-auto object-contain hidden dark:block"
              />
              <img
                src="/logo-light-v2.png"
                alt="TransitOps"
                className="h-8 w-auto object-contain block dark:hidden"
              />
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleSmoothScroll(e, link.href)}
                className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
              >
                {link.label}
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary group-hover:w-1/2 transition-all duration-300 rounded-full" />
              </a>
            ))}
          </div>

          {/* CTA & Actions Group */}
          <div className="hidden md:flex items-center gap-4">


            <ThemeToggle />

            {/* Proceed Button with custom hover shimmer */}
            <Link
              href="/login"
              className="relative overflow-hidden group px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-bold tracking-tight shadow-md hover:bg-foreground/90 transition-all active:scale-[0.98]"
            >
              {/* Shimmer Effect */}
              <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <span className="relative z-10 flex items-center gap-1.5">
                Proceed
                <svg
                  className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </Link>
          </div>

          {/* Mobile Actions and Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg hover:bg-muted/40 transition-colors text-foreground"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/40"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleSmoothScroll(e, link.href)}
                  className="block px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-all"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t border-border/40 space-y-3">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center py-3 rounded-lg bg-foreground text-background text-sm font-bold shadow-md hover:bg-foreground/90 transition-all"
                >
                  Proceed
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
