"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Truck, Wrench, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigation = [
    {
      name: "Trips",
      href: "/trips",
      icon: Truck,
      description: "Dispatch & routes",
    },
    {
      name: "Maintenance",
      href: "/maintenance",
      icon: Wrench,
      description: "Workshop & repairs",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/50 dark:bg-neutral-950">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-sm">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  TransitOps
                </span>
                <span className="ml-2 rounded-full bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Operations
                </span>
              </div>
            </div>

            {/* Navigation tabs */}
            <nav className="flex items-center gap-1 sm:gap-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-blue-600 text-white shadow-sm font-semibold"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Role indicator */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-800/60 px-3 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Fleet Operations Mode</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
