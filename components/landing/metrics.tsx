"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  Fuel,
  DollarSign,
  Activity,
} from "lucide-react";

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  iconBg: string;
  delay: number;
}

const metrics: MetricCardProps[] = [
  {
    icon: <Fuel className="w-5 h-5 text-blue-400" />,
    label: "Avg. Fuel Efficiency",
    value: "12.4 km/L",
    subtext: "Fleet-wide tracking across all active vehicles",
    iconBg: "bg-blue-500/15",
    delay: 0,
  },
  {
    icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
    label: "Cost per Kilometer",
    value: "₹8.72",
    subtext: "Blended rate including fuel, maintenance & tolls",
    iconBg: "bg-emerald-500/15",
    delay: 0.1,
  },
  {
    icon: <Activity className="w-5 h-5 text-orange-400" />,
    label: "Vehicle Utilization",
    value: "87.3%",
    subtext: "Active vs. grounded fleet ratio this quarter",
    iconBg: "bg-orange-500/15",
    delay: 0.2,
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-purple-400" />,
    label: "Compliance Score",
    value: "96.1%",
    subtext: "Driver license validity & safety check pass rate",
    iconBg: "bg-purple-500/15",
    delay: 0.3,
  },
];

export default function Metrics() {
  return (
    <section id="metrics" className="relative py-24 sm:py-32">
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
          <span className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold tracking-wide uppercase mb-4">
            Fleet Analytics
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Operational{" "}
            <span className="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">
              Metrics at a Glance
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Track fuel efficiency, cost-per-kilometer, vehicle utilization, and
            compliance scores with real-time fleet analytics.
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {metrics.map((metric) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.6,
                delay: metric.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group relative"
            >
              <div className="h-full p-6 rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-slate-800/60 hover:border-slate-700/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 text-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-xl ${metric.iconBg} mx-auto mb-4 transition-transform group-hover:scale-110`}
                >
                  {metric.icon}
                </div>
                <p className="text-3xl font-extrabold text-white mb-1 tabular-nums">
                  {metric.value}
                </p>
                <p className="text-sm font-semibold text-slate-300 mb-2">
                  {metric.label}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {metric.subtext}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
