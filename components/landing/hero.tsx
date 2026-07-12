"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Truck,
  MapPin,
  Wrench,
  TrendingUp,
  Zap,
  ArrowRight,
} from "lucide-react";

interface CounterProps {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
}

function AnimatedCounter({
  label,
  value,
  suffix = "",
  icon,
  color,
}: CounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const step = Math.ceil(value / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:border-slate-600/60 transition-all group">
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-lg ${color} transition-transform group-hover:scale-110`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold text-white tabular-nums">
          {count.toLocaleString()}
          {suffix}
        </p>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20 lg:pt-0">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/8 rounded-full blur-3xl animate-pulse delay-1000" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column – Copy */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide uppercase mb-6"
            >
              <Zap className="w-3.5 h-3.5" />
              100% Local-First Fleet Intelligence
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              <span className="text-white">Operational Intelligence for </span>
              <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-orange-400 bg-clip-text text-transparent">
                Modern Fleet Logistics
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
              Optimize vehicle dispatch, enforce driver safety compliance,
              automate maintenance grounding, and track operational ROI—all from
              a unified, lightning-fast platform.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/login"
                id="hero-launch-app"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold text-white rounded-xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-orange-500/20"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-orange-500 to-blue-600 group-hover:from-orange-400 group-hover:to-blue-500 transition-all duration-500" />
                <span className="relative flex items-center gap-2">
                  Explore Persona Quick-Login
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <a
                href="#architecture"
                id="hero-view-arch"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold text-slate-300 hover:text-white border border-slate-700/60 hover:border-slate-500 rounded-xl transition-all hover:bg-slate-800/50"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .querySelector("#architecture")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                View Architecture Specs
              </a>
            </div>
          </motion.div>

          {/* Right Column – Live Fleet Status Card */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative"
          >
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-transparent to-orange-500/20 blur-3xl rounded-3xl" />

            <div className="relative p-6 sm:p-8 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 shadow-2xl">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Fleet Status — Live
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time operational overview
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-medium text-emerald-400">
                    Online
                  </span>
                </div>
              </div>

              {/* Counter Grid */}
              <div className="grid grid-cols-2 gap-3">
                <AnimatedCounter
                  label="Active Vehicles"
                  value={48}
                  icon={<Truck className="w-5 h-5 text-emerald-400" />}
                  color="bg-emerald-500/15"
                />
                <AnimatedCounter
                  label="Dispatched Trips"
                  value={127}
                  icon={<MapPin className="w-5 h-5 text-blue-400" />}
                  color="bg-blue-500/15"
                />
                <AnimatedCounter
                  label="Pending Repairs"
                  value={12}
                  icon={<Wrench className="w-5 h-5 text-amber-400" />}
                  color="bg-amber-500/15"
                />
                <AnimatedCounter
                  label="Fuel ROI"
                  value={94}
                  suffix="%"
                  icon={<TrendingUp className="w-5 h-5 text-orange-400" />}
                  color="bg-orange-500/15"
                />
              </div>

              {/* Utilization Bar */}
              <div className="mt-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">
                    Fleet Utilization Rate
                  </span>
                  <span className="text-sm font-bold text-blue-400">87.3%</span>
                </div>
                <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "87.3%" }}
                    transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
