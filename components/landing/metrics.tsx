"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  Fuel,
  IndianRupee,
  Activity,
  CheckCircle2,
} from "lucide-react";

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: string;
  delay: number;
}

const metrics: MetricCardProps[] = [
  {
    icon: <Fuel className="w-5 h-5" />,
    label: "Avg. Fuel Efficiency",
    value: "12.4 km/L",
    subtext: "Fleet-wide average tracked per fuel receipt.",
    color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    delay: 0.05,
  },
  {
    icon: <IndianRupee className="w-5 h-5" />,
    label: "Cost per Kilometer",
    value: "₹8.72 / km",
    subtext: "Includes aggregated fuel, toll, and in_shop records.",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    delay: 0.1,
  },
  {
    icon: <Activity className="w-5 h-5" />,
    label: "Vehicle Utilization",
    value: "87.3%",
    subtext: "Active dispatched assets vs. total fleet count.",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    delay: 0.15,
  },
  {
    icon: <CheckCircle2 className="w-5 h-5" />,
    label: "Compliance Score",
    value: "98.8%",
    subtext: "Zero active license alerts or safety violations.",
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    delay: 0.2,
  },
];

function MetricCard({ icon, label, value, subtext, color, delay }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay }}
      className="group relative"
    >
      <div className="h-full p-6 rounded-xl bg-card border border-border/50 hover:border-border transition-all duration-300 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.015)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.12)]">
        <div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${color} mb-4`}>
            {icon}
          </div>
          <p className="text-2xl font-extrabold text-foreground font-mono leading-none tracking-tight mb-2">
            {value}
          </p>
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1">
            {label}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed font-sans">
            {subtext}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Metrics() {
  return (
    <section id="metrics" className="relative py-24 sm:py-32 bg-background border-t border-border/30">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-left mb-16 max-w-2xl">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 text-xs font-mono font-bold uppercase tracking-wider mb-4">
            Fleet Analytics
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-display mb-4">
            Telemetry & Operation Margins.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-sans">
            Continuous local-first database scans calculate efficiency metrics across dispatch nodes, drivers, and grounding events automatically.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

      </div>
    </section>
  );
}
