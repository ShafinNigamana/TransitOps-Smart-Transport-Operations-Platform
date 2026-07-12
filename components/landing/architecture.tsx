"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Shield, Terminal, ArrowRight, Code, Server, Cookie } from "lucide-react";

interface TechPillar {
  icon: React.ReactNode;
  title: string;
  description: string;
  tag: string;
}

const pillars: TechPillar[] = [
  {
    icon: <Database className="w-5 h-5 text-primary" />,
    title: "Zero Cloud Latency",
    description:
      "Fully operational database hosted locally on localhost:5432 running PostgreSQL 18. Zero external API calls, sub-millisecond query execution, and high security offline availability.",
    tag: "PostgreSQL 18",
  },
  {
    icon: <Shield className="w-5 h-5 text-accent" />,
    title: "Type-Safe Actions Flow",
    description:
      "Powered by Next.js 15 Server Actions, compiled under strict TypeScript. Zod schema validation blocks invalid operations from hitting the local database.",
    tag: "TS + Zod Primitives",
  },
  {
    icon: <Cookie className="w-5 h-5 text-fleet-sage" />,
    title: "HTTP Session Auth",
    description:
      "Fast local role switching via stateless HTTP session cookies. Avoids cloud auth bottlenecks or external OAuth redirect overhead.",
    tag: "Cookie Session",
  },
];

const codeTabs = [
  {
    id: "schema",
    filename: "schema.sql",
    language: "sql",
    code: `CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  license_plate VARCHAR(20) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'in_shop')),
  max_capacity_kg INTEGER NOT NULL CHECK (max_capacity_kg > 0)
);

CREATE TABLE drivers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  license_expiry DATE NOT NULL,
  safety_rating DECIMAL(3,2) DEFAULT 5.0
);`,
  },
  {
    id: "auth",
    filename: "auth.ts",
    language: "typescript",
    code: `export async function demoLogin(role: string) {
  const cookieStore = await cookies();
  
  // Set fast local session cookie for instant RBAC switching
  cookieStore.set("transitops_session", JSON.stringify({ role }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  
  return redirect("/dashboard");
}`,
  },
  {
    id: "guard",
    filename: "capacity-guard.ts",
    language: "typescript",
    code: `import { z } from "zod";

const DispatchSchema = z.object({
  vehicleId: z.number(),
  cargoWeightKg: z.number(),
});

export async function validateDispatch(data: unknown, maxKg: number) {
  const parsed = DispatchSchema.parse(data);
  
  // Cargo Capacity Guard Validation Rule
  if (parsed.cargoWeightKg > maxKg) {
    throw new Error(\`Overloaded by \${parsed.cargoWeightKg - maxKg} kg\`);
  }
}`,
  },
];

export default function Architecture() {
  const [activeTab, setActiveTab] = useState("schema");

  const currentTab = codeTabs.find((tab) => tab.id === activeTab) || codeTabs[0];

  return (
    <section id="architecture" className="relative py-24 sm:py-32 bg-background border-t border-border/30">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-left mb-16 max-w-2xl">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-mono font-bold uppercase tracking-wider mb-4">
            Technical Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-display mb-4">
            Engineered for Zero-Cloud Speed.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-sans">
            A high-performance local stack bypassing cloud overhead. Powered by Next.js 15 Server Actions, local session auth cookies, and PostgreSQL 18.
          </p>
        </div>

        {/* Pillars & Terminal Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Pillars */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            {pillars.map((p, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-card border border-border/50 hover:border-border transition-all duration-300 flex items-start gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.015)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.12)]"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted shrink-0 text-foreground">
                  {p.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-bold text-foreground tracking-tight font-sans">{p.title}</h3>
                    <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/30 font-semibold">
                      {p.tag}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
                    {p.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Interactive Code Sandbox */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex-1 rounded-2xl bg-card border border-border/60 overflow-hidden flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
              
              {/* Terminal Window Header */}
              <div className="bg-muted/40 border-b border-border/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  <span className="text-xs text-muted-foreground font-mono ml-2 font-semibold flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5" /> local-engine
                  </span>
                </div>
                
                {/* Code Tabs */}
                <div className="flex items-center gap-1.5">
                  {codeTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded transition-all cursor-pointer ${
                        activeTab === tab.id
                          ? "bg-card text-foreground border border-border/60 shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.filename}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Editor Box */}
              <div className="flex-1 p-5 overflow-auto font-mono text-xs sm:text-sm leading-relaxed bg-[#080B11] dark:bg-[#02050A] text-slate-300 select-all min-h-[300px] shadow-inner">
                <AnimatePresence mode="wait">
                  <motion.pre
                    key={activeTab}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-pre-wrap"
                  >
                    <code>{currentTab.code}</code>
                  </motion.pre>
                </AnimatePresence>
              </div>

              {/* Terminal Footer Bar */}
              <div className="bg-muted/20 border-t border-border/40 px-4 py-2.5 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                <span>PostgreSQL Connection: OK</span>
                <span>UTF-8</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
