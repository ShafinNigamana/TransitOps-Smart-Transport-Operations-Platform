"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Gauge,
  Wrench,
  Fuel,
  BarChart3,
  Users,
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
  delay: number;
}

const features: FeatureCardProps[] = [
  {
    icon: <Gauge className="w-6 h-6" />,
    title: "Cargo Capacity Guard",
    description:
      "Smart pre-dispatch check that prevents overloading by matching cargo weight against vehicle max_capacity_kg. Never exceed safe payload limits again.",
    gradient: "from-blue-500/10 to-blue-600/5",
    iconBg: "bg-blue-500/15 text-blue-400",
    delay: 0,
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Driver Compliance & Expiry Alert",
    description:
      "Automatic validation of driver license categories and expiry dates with 30-day warning indicators. Ensure full driver safety compliance before dispatch.",
    gradient: "from-emerald-500/10 to-emerald-600/5",
    iconBg: "bg-emerald-500/15 text-emerald-400",
    delay: 0.1,
  },
  {
    icon: <Wrench className="w-6 h-6" />,
    title: "Automated Maintenance Grounding",
    description:
      "Instant vehicle status transition to in_shop upon repair logging, automatically hiding unavailable units from dispatch queues.",
    gradient: "from-amber-500/10 to-amber-600/5",
    iconBg: "bg-amber-500/15 text-amber-400",
    delay: 0.2,
  },
  {
    icon: <Fuel className="w-6 h-6" />,
    title: "Fuel & Cost Tracking",
    description:
      "Comprehensive expense logging, fuel consumption tracking, and detailed cost breakdowns per trip. Monitor cost-per-kilometer metrics in real time.",
    gradient: "from-orange-500/10 to-orange-600/5",
    iconBg: "bg-orange-500/15 text-orange-400",
    delay: 0.3,
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Operational Analytics",
    description:
      "Real-time metrics for fuel efficiency (km/L), Cost-per-KM, and vehicle utilization rates. Export operational data to CSV for external analysis.",
    gradient: "from-purple-500/10 to-purple-600/5",
    iconBg: "bg-purple-500/15 text-purple-400",
    delay: 0.4,
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Role-Based Workflows",
    description:
      "Contextual navigation and permissions tailored to Fleet Managers, Drivers, Safety Officers, and Financial Analysts with full RBAC enforcement.",
    gradient: "from-cyan-500/10 to-cyan-600/5",
    iconBg: "bg-cyan-500/15 text-cyan-400",
    delay: 0.5,
  },
];

function FeatureCard({
  icon,
  title,
  description,
  gradient,
  iconBg,
  delay,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <div
        className={`relative h-full p-6 rounded-2xl bg-gradient-to-br ${gradient} border border-slate-800/60 hover:border-slate-700/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20`}
      >
        {/* Icon */}
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-xl ${iconBg} mb-5 transition-transform group-hover:scale-110`}
        >
          {icon}
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>

        {/* Hover glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    </motion.div>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      {/* Subtle background divider */}
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
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide uppercase mb-4">
            Core Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Fleet Management System —{" "}
            <span className="bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">
              Built for Operations
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Every business rule, safety constraint, and logistics workflow baked
            into a single, zero-cloud-dependency platform.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
