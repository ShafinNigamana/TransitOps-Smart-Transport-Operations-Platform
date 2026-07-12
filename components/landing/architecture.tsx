"use client";

import { motion } from "framer-motion";
import { Server, Code2, Cookie, Database, Layers, Lock } from "lucide-react";

interface ArchPillar {
  icon: React.ReactNode;
  title: string;
  description: string;
  tags: string[];
  iconBg: string;
}

const pillars: ArchPillar[] = [
  {
    icon: <Server className="w-6 h-6 text-blue-400" />,
    title: "Zero-Cloud Latency",
    description:
      "Built on a local-first Node.js runtime with PostgreSQL 18 as the database engine. All data stays on-premises with sub-millisecond query performance.",
    tags: ["Local SQL Database", "PostgreSQL 18", "On-Premises"],
    iconBg: "bg-blue-500/15",
  },
  {
    icon: <Code2 className="w-6 h-6 text-emerald-400" />,
    title: "Type-Safe Data Flow",
    description:
      "Next.js 15 App Router with Server Actions providing full end-to-end TypeScript validation. Zod schemas enforce data integrity from form to database.",
    tags: ["Next.js 15 App Router", "Server Actions", "TypeScript"],
    iconBg: "bg-emerald-500/15",
  },
  {
    icon: <Cookie className="w-6 h-6 text-amber-400" />,
    title: "HTTP Session Cookie Auth",
    description:
      "Fast, lightweight local persona switching via HTTP-only session cookies. No third-party auth dependencies—simple, secure, and zero-latency.",
    tags: ["Session Cookies", "HTTP-Only", "Persona Switching"],
    iconBg: "bg-amber-500/15",
  },
];

const techStack = [
  { icon: <Layers className="w-4 h-4" />, name: "Next.js 15 App Router" },
  { icon: <Code2 className="w-4 h-4" />, name: "TypeScript + Zod" },
  { icon: <Database className="w-4 h-4" />, name: "PostgreSQL 18" },
  { icon: <Lock className="w-4 h-4" />, name: "Tailwind CSS v4" },
];

export default function Architecture() {
  return (
    <section id="architecture" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide uppercase mb-4">
            Engineering Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Local-First{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Technical Engine
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Engineered for zero-cloud dependency with type-safe data pipelines,
            server-side rendering, and lightning-fast local database queries.
          </p>
        </motion.div>

        {/* Pillar Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.6,
                delay: i * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group relative"
            >
              <div className="h-full p-6 rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-slate-800/60 hover:border-slate-700/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-xl ${pillar.iconBg} mb-5 transition-transform group-hover:scale-110`}
                >
                  {pillar.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {pillar.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-5">
                  {pillar.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {pillar.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-[11px] font-medium bg-slate-800/60 text-slate-400 border border-slate-700/40 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tech Stack Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4"
        >
          {techStack.map((tech) => (
            <div
              key={tech.name}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60 text-sm font-medium text-slate-300"
            >
              <span className="text-slate-500">{tech.icon}</span>
              {tech.name}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
