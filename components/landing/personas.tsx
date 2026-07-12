"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  Route,
  ShieldCheck,
  DollarSign,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface Persona {
  id: string;
  role: string;
  label: string;
  color: string;
  accentBg: string;
  borderColor: string;
  dotColor: string;
  icon: React.ReactNode;
  headline: string;
  description: string;
  capabilities: string[];
}

const personas: Persona[] = [
  {
    id: "fleet_manager",
    role: "Fleet Manager",
    label: "🟠",
    color: "text-orange-400",
    accentBg: "bg-orange-500/10",
    borderColor: "border-orange-500/30 hover:border-orange-500/50",
    dotColor: "bg-orange-500",
    icon: <Truck className="w-6 h-6 text-orange-400" />,
    headline: "Command Center for Fleet Operations",
    description:
      "Full dispatch center access with vehicle allocation, fleet health monitoring, and real-time trip dispatching across your entire logistics network.",
    capabilities: [
      "Vehicle dispatch & trip assignment",
      "Fleet health monitoring dashboard",
      "Cargo capacity pre-dispatch validation",
      "Operational cost overview & ROI tracking",
    ],
  },
  {
    id: "driver",
    role: "Driver",
    label: "🟢",
    color: "text-emerald-400",
    accentBg: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30 hover:border-emerald-500/50",
    dotColor: "bg-emerald-500",
    icon: <Route className="w-6 h-6 text-emerald-400" />,
    headline: "Your Active Trip Dashboard",
    description:
      "View assigned trips, log odometer readings, update active route status, and track fuel consumption from a streamlined driver interface.",
    capabilities: [
      "Assigned trip queue & route details",
      "Odometer reading logger",
      "Active route status updates",
      "Fuel log submission",
    ],
  },
  {
    id: "safety_officer",
    role: "Safety Officer",
    label: "🟡",
    color: "text-yellow-400",
    accentBg: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30 hover:border-yellow-500/50",
    dotColor: "bg-yellow-500",
    icon: <ShieldCheck className="w-6 h-6 text-yellow-400" />,
    headline: "Compliance & Safety Intelligence",
    description:
      "Monitor driver license verification status, track safety ratings, manage compliance checks, and enforce license expiry alert workflows.",
    capabilities: [
      "Driver license category verification",
      "30-day expiry warning system",
      "Safety rating tracking & audits",
      "Vehicle grounding workflow enforcement",
    ],
  },
  {
    id: "financial_analyst",
    role: "Financial Analyst",
    label: "⚪",
    color: "text-slate-300",
    accentBg: "bg-slate-500/10",
    borderColor: "border-slate-500/30 hover:border-slate-400/50",
    dotColor: "bg-slate-400",
    icon: <DollarSign className="w-6 h-6 text-slate-300" />,
    headline: "Financial & Operational Analytics",
    description:
      "Access operational cost breakdowns, fuel expense analysis, cost-per-kilometer metrics, and export comprehensive CSV reports for stakeholders.",
    capabilities: [
      "Cost-per-kilometer analysis",
      "Fuel efficiency reports (km/L)",
      "Expense breakdown by category",
      "CSV export for external reporting",
    ],
  },
];

export default function Personas() {
  const [activeId, setActiveId] = useState<string>("fleet_manager");
  const active = personas.find((p) => p.id === activeId) ?? personas[0];

  return (
    <section id="personas" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/20 to-slate-950" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold tracking-wide uppercase mb-4">
            Role-Based Access Control
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Four Personas,{" "}
            <span className="bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">
              One Unified Platform
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Each role gets a contextual, purpose-built interface optimized for
            their daily workflow. Quick-login to explore any persona.
          </p>
        </motion.div>

        {/* Persona Selector Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {personas.map((p) => (
            <button
              key={p.id}
              id={`persona-tab-${p.id}`}
              onClick={() => setActiveId(p.id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border ${
                activeId === p.id
                  ? `${p.accentBg} ${p.borderColor.split(" ")[0]} ${p.color} shadow-lg`
                  : "bg-slate-900/50 border-slate-800/60 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800/80">
                {p.icon}
              </span>
              {p.role}
            </button>
          ))}
        </div>

        {/* Active Persona Detail Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl mx-auto"
          >
            <div
              className={`relative p-8 sm:p-10 rounded-2xl bg-slate-900/60 backdrop-blur-xl border ${active.borderColor.split(" ")[0]} shadow-2xl`}
            >
              {/* Glow accent */}
              <div
                className={`absolute -top-px left-1/4 right-1/4 h-px ${active.accentBg.replace("/10", "/30")}`}
                style={{
                  background: `linear-gradient(90deg, transparent, ${active.color === "text-orange-400" ? "#F97316" : active.color === "text-emerald-400" ? "#10B981" : active.color === "text-yellow-400" ? "#EAB308" : "#94A3B8"}40, transparent)`,
                }}
              />

              <div className="grid md:grid-cols-2 gap-8">
                {/* Left – Content */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-xl ${active.accentBg} border border-slate-700/40`}
                    >
                      {active.icon}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-semibold ${active.color} uppercase tracking-wider`}
                      >
                        {active.role}
                      </p>
                      <p className="text-xs text-slate-500">
                        Role-based persona
                      </p>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3">
                    {active.headline}
                  </h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                    {active.description}
                  </p>

                  <Link
                    href="/login"
                    id={`persona-login-${active.id}`}
                    className="group inline-flex items-center gap-2 px-6 py-3 font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-orange-500 rounded-xl transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/20"
                  >
                    Login as {active.role}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                {/* Right – Capabilities */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    Key Capabilities
                  </p>
                  {active.capabilities.map((cap, i) => (
                    <motion.div
                      key={cap}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30"
                    >
                      <CheckCircle2
                        className={`w-5 h-5 ${active.color} mt-0.5 shrink-0`}
                      />
                      <span className="text-sm text-slate-300 font-medium">
                        {cap}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
