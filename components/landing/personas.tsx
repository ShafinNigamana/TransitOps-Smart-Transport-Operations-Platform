"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  User,
  ShieldCheck,
  BarChart3,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowRight,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

interface PersonaData {
  id: string;
  role: string;
  badge: string;
  dotColor: string;
  icon: React.ReactNode;
  headline: string;
  description: string;
  systemMetrics: { label: string; value: string; isSecret?: boolean }[];
  accentColor: string;
}

const personasData: PersonaData[] = [
  {
    id: "fleet_manager",
    role: "Fleet Manager",
    badge: "🟠 Ops Center",
    dotColor: "bg-primary",
    icon: <Truck className="w-5 h-5" />,
    headline: "Dispatch Control & Allocation",
    description:
      "Review active dispatch requests, track max cargo weight validations, allocate assets, and manage trip dispatching across the system.",
    accentColor: "border-primary/30 text-primary bg-primary/10",
    systemMetrics: [
      { label: "Fleet Health", value: "98% Online" },
      { label: "Active Trips", value: "24 Trips" },
      { label: "Grounded Units", value: "12 in_shop" },
      { label: "Capacity Limit", value: "Max 12.5t" },
    ],
  },
  {
    id: "driver",
    role: "Driver",
    badge: "🟢 Trip Log",
    dotColor: "bg-accent",
    icon: <User className="w-5 h-5" />,
    headline: "Personal Logs & Odometer Entries",
    description:
      "A distraction-free UI to check assigned trips, update active route status, log odometer changes, and record fuel receipts.",
    accentColor: "border-accent/30 text-accent bg-accent/10",
    systemMetrics: [
      { label: "Driver ID", value: "DRV-908" },
      { label: "Assigned Route", value: "Delhi-NCR Hub" },
      { label: "Odometer Today", value: "48,290 km" },
      { label: "Next Shift", value: "Tomorrow 08:00" },
    ],
  },
  {
    id: "safety_officer",
    role: "Safety Officer",
    badge: "🟡 Compliance Guard",
    dotColor: "bg-fleet-ochre",
    icon: <ShieldCheck className="w-5 h-5" />,
    headline: "Safety Ratings & Expiry Alerts",
    description:
      "Monitor driver license validity warning triggers, safety compliance violations, and enforce immediate maintenance grounding rules.",
    accentColor: "border-fleet-ochre/30 text-fleet-ochre bg-fleet-ochre/10",
    systemMetrics: [
      { label: "License Alerts", value: "1 Pending (<30d)" },
      { label: "Grounded (in_shop)", value: "12 Vehicles" },
      { label: "Safety Score", value: "96.4%" },
      { label: "Fuel Expenses", value: "₹0.00", isSecret: true }, // Zeroed/hidden financials
    ],
  },
  {
    id: "financial_analyst",
    role: "Financial Analyst",
    badge: "⚪ ROI Analytics",
    dotColor: "bg-fleet-sage",
    icon: <BarChart3 className="w-5 h-5" />,
    headline: "Operational Margins & Expenses",
    description:
      "Audit Cost-per-Kilometer logs, track total fuel expenses in ₹ INR, and download compliance audits in CSV/PDF files.",
    accentColor: "border-fleet-sage/30 text-fleet-sage bg-fleet-sage/10",
    systemMetrics: [
      { label: "Total Fuel Spend", value: "₹3,42,500" },
      { label: "Avg Cost / KM", value: "₹8.72" },
      { label: "Trip Margins", value: "24.2%" },
      { label: "Pending Claims", value: "3 Tickets" },
    ],
  },
];

export default function Personas() {
  const [selectedId, setSelectedId] = useState("fleet_manager");
  const [odometerInput, setOdometerInput] = useState("48290");

  const currentPersona = personasData.find((p) => p.id === selectedId) || personasData[0];

  const handleSimulateAction = (action: string) => {
    toast.success(`Success: Mocking action "${action}" for ${currentPersona.role}`);
  };

  return (
    <section id="personas" className="relative py-24 sm:py-32 bg-background border-t border-border/30">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold uppercase tracking-wider mb-4">
            Role-Based Access
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-display mb-4">
            Four Personas. One Database.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-sans">
            TransitOps dynamically updates navigation, forms, alerts, and metrics based on active user roles to ensure tight compliance.
          </p>
        </div>

        {/* Matrix Tab Selector */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {personasData.map((p) => {
            const isSelected = selectedId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border text-sm font-semibold transition-all duration-300 shadow-sm cursor-pointer select-none ${
                  isSelected
                    ? `${p.accentColor} shadow-md`
                    : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${p.dotColor}`} />
                {p.role}
              </button>
            );
          })}
        </div>

        {/* Dynamic Display Panel */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedId}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="p-6 sm:p-8 rounded-2xl bg-card border border-border/50 shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.25)]"
            >
              <div className="grid md:grid-cols-12 gap-8 items-start">
                
                {/* Left side: Persona Details */}
                <div className="md:col-span-7 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-foreground">
                        {currentPersona.icon}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-foreground font-sans">{currentPersona.role}</h4>
                        <span className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase font-semibold">
                          RBAC Role Profile
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xl font-extrabold text-foreground tracking-tight mb-3 font-display">
                      {currentPersona.headline}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6 font-sans">
                      {currentPersona.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/login"
                      className="group inline-flex items-center gap-2 px-5 py-3 text-xs font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/95 transition-all shadow-md active:scale-[0.98]"
                    >
                      Login as {currentPersona.role}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>

                {/* Right side: Mock Interface Sandbox */}
                <div className="md:col-span-5 p-5 rounded-xl bg-muted/40 border border-border/40 shadow-inner">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase block mb-4">
                    Role Interface Mockup
                  </span>

                  {/* System Metrics List */}
                  <div className="space-y-3 mb-5">
                    {currentPersona.systemMetrics.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/40 shadow-xs"
                      >
                        <span className="text-xs text-muted-foreground font-semibold font-sans">{m.label}</span>
                        {m.isSecret ? (
                          <span className="flex items-center gap-1 text-[11px] font-mono text-fleet-ochre font-bold bg-fleet-ochre/10 px-2 py-0.5 rounded border border-fleet-ochre/20">
                            <EyeOff className="w-3 h-3" /> HIDDEN
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-foreground font-mono">{m.value}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Sandbox Interactive Action Block */}
                  <div className="pt-4 border-t border-border/30">
                    {selectedId === "fleet_manager" && (
                      <div className="space-y-3">
                        <span className="text-[11px] font-semibold text-foreground font-sans block">
                          Active Dispatch Actions:
                        </span>
                        <button
                          onClick={() => handleSimulateAction("Dispatch Trip #408")}
                          className="w-full text-center py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                        >
                          Dispatch Cargo (max_capacity_kg Guard)
                        </button>
                      </div>
                    )}

                    {selectedId === "driver" && (
                      <div className="space-y-3">
                        <label className="text-[11px] font-semibold text-foreground font-sans block">
                          Submit Odometer Update (km):
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={odometerInput}
                            onChange={(e) => setOdometerInput(e.target.value)}
                            className="bg-card border border-border rounded-lg px-2.5 py-1 text-xs font-mono w-full text-foreground focus:outline-none focus:border-primary shadow-xs"
                          />
                          <button
                            onClick={() => handleSimulateAction(`Odometer logged at ${odometerInput} km`)}
                            className="px-3 py-1.5 bg-foreground text-background text-xs font-bold rounded-lg hover:bg-foreground/90 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                          >
                            Log
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedId === "safety_officer" && (
                      <div className="space-y-3">
                        <span className="text-[11px] font-semibold text-foreground font-sans block flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-fleet-ochre" /> Compliance Trigger:
                        </span>
                        <button
                          onClick={() => handleSimulateAction("Enforce Grounding (in_shop)")}
                          className="w-full text-center py-2 bg-fleet-ochre text-white text-xs font-bold rounded-lg hover:bg-fleet-ochre/90 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                        >
                          Ground Vehicle for License Defect
                        </button>
                      </div>
                    )}

                    {selectedId === "financial_analyst" && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-semibold text-foreground font-sans block">
                          Export Compliance Datasets:
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleSimulateAction("Export CSV logs")}
                            className="flex items-center justify-center gap-1 py-2 border border-border/80 hover:bg-muted text-[11px] font-bold rounded-lg text-foreground transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                          >
                            <Download className="w-3 h-3" /> CSV Export
                          </button>
                          <button
                            onClick={() => handleSimulateAction("Export PDF report")}
                            className="flex items-center justify-center gap-1 py-2 border border-border/80 hover:bg-muted text-[11px] font-bold rounded-lg text-foreground transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                          >
                            <Download className="w-3 h-3" /> PDF Export
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
