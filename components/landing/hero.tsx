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
  Plus,
  RefreshCw,
} from "lucide-react";

interface CounterProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
}

function SpringCounter({
  label,
  value,
  prefix = "",
  suffix = "",
  icon,
  color,
}: CounterProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 800; // ms
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const ease = progress * (2 - progress);
      const current = Math.round(start + (end - start) * ease);
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 hover:border-border transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.15)] group">
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${color} transition-transform group-hover:scale-105`}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold text-foreground font-mono leading-none tracking-tight">
          {prefix}
          {displayValue.toLocaleString()}
          {suffix}
        </p>
        <p className="text-[11px] text-muted-foreground font-mono font-semibold mt-1.5 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

export default function Hero() {
  const [activeVehicles, setActiveVehicles] = useState(48);
  const [dispatchedTrips, setDispatchedTrips] = useState(127);
  const [groundedUnits, setGroundedUnits] = useState(12);
  const [fuelSpend, setFuelSpend] = useState(342500);

  const handleSimulateDispatch = () => {
    setActiveVehicles((prev) => prev + 1);
    setDispatchedTrips((prev) => prev + 1);
    setFuelSpend((prev) => prev + 8400);
  };

  const handleSimulateGrounding = () => {
    if (activeVehicles > 0) {
      setActiveVehicles((prev) => prev - 1);
      setGroundedUnits((prev) => prev + 1);
    }
  };

  const handleResetSimulation = () => {
    setActiveVehicles(48);
    setDispatchedTrips(127);
    setGroundedUnits(12);
    setFuelSpend(342500);
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-28 lg:pt-20 pb-20 bg-background">
      
      {/* Background Grid & Signature Animated Route Trace Line */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {/* Fine Linear Grid */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
        
        {/* SVG Route Map Trace System */}
        <svg className="absolute inset-0 w-full h-full opacity-20 dark:opacity-30" xmlns="http://www.w3.org/2000/svg">
          {/* Animated Paths */}
          <path
            d="M -100 200 Q 200 150 400 450 T 900 300 T 1600 600"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.5"
            strokeDasharray="8 8"
            className="route-line opacity-60"
            style={{ strokeDashoffset: 1200 }}
          />
          <path
            d="M 100 800 Q 500 600 800 800 T 1400 400"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            className="route-line opacity-50"
            style={{ strokeDashoffset: 800 }}
          />
          
          {/* Hub Nodes */}
          <circle cx="400" cy="450" r="4" fill="var(--primary)" className="animate-pulse" />
          <circle cx="800" cy="800" r="4" fill="var(--accent)" className="animate-pulse" />
          <circle cx="900" cy="300" r="4" fill="var(--primary)" />
        </svg>

        {/* Subtle radial lights */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-accent/5 dark:bg-accent/10 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column - Copywriting */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
            className="lg:col-span-6 flex flex-col items-start text-left"
          >
            {/* Pill Badge */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold uppercase tracking-wider mb-6"
            >
              <Zap className="w-3.5 h-3.5 fill-primary" />
              [ ⚡ 100% Local-First Fleet Intelligence ]
            </motion.div>

            {/* Headline with premium font-display and letter spacing */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground mb-6 font-display">
              Operational Intelligence for Modern{" "}
              <span className="text-primary tracking-normal">
                Fleet Logistics.
              </span>
            </h1>

            {/* Subheadline with clear layout padding and typography measure */}
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl font-sans">
              Optimize vehicle dispatch, enforce driver safety compliance, automate maintenance grounding, and track operational ROI in ₹ INR—all from an ultra-fast local platform.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                href="/login"
                id="hero-launch-app"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-sm text-primary-foreground rounded-xl bg-primary hover:bg-primary/95 transition-all duration-300 active:scale-[0.98] shadow-[0_4px_12px_rgba(217,122,43,0.15)] dark:shadow-[0_4px_20px_rgba(217,122,43,0.2)]"
              >
                Explore App Persona Quick-Login
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#architecture"
                id="hero-view-arch"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-sm text-foreground border border-border/80 hover:border-foreground/40 hover:bg-muted/30 rounded-xl transition-all duration-300 active:scale-[0.98] shadow-xs"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector("#architecture")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                View Technical Specs
              </a>
            </div>
          </motion.div>

          {/* Right Column - Interactive Telemetry Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.3 }}
            className="lg:col-span-6 relative w-full"
          >
            {/* Soft background glow */}
            <div className="absolute -inset-4 bg-primary/5 dark:bg-primary/10 rounded-2xl blur-3xl pointer-events-none" />

            <div className="relative p-6 sm:p-8 rounded-2xl bg-card border border-border/60 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              
              {/* Mockup Window Chrome Header */}
              <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-6">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  <span className="text-xs text-muted-foreground font-mono ml-2 font-semibold">transitops-console.sql</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20 text-[11px] font-mono font-bold text-accent uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse shrink-0" />
                  Active Engine
                </div>
              </div>

              {/* Counters Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <SpringCounter
                  label="Active Vehicles"
                  value={activeVehicles}
                  icon={<Truck className="w-5 h-5 text-accent" />}
                  color="bg-accent/10 text-accent border border-accent/20"
                />
                <SpringCounter
                  label="Trips Dispatched"
                  value={dispatchedTrips}
                  icon={<MapPin className="w-5 h-5 text-fleet-sage" />}
                  color="bg-fleet-sage/10 text-fleet-sage border border-fleet-sage/20"
                />
                <SpringCounter
                  label="Grounded Units"
                  value={groundedUnits}
                  icon={<Wrench className="w-5 h-5 text-fleet-red" />}
                  color="bg-fleet-red/10 text-fleet-red border border-fleet-red/20"
                />
                <SpringCounter
                  label="Fuel Spend (₹)"
                  value={fuelSpend}
                  prefix="₹"
                  icon={<TrendingUp className="w-5 h-5 text-primary" />}
                  color="bg-primary/10 text-primary border border-primary/20"
                />
              </div>

              {/* Simulation Interactive Panel */}
              <div className="p-5 rounded-xl bg-muted/40 border border-border/40 shadow-inner">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                    Interactive Controller
                  </span>
                  <button
                    onClick={handleResetSimulation}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Reset Simulation"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={handleSimulateDispatch}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-foreground text-background text-xs font-bold hover:bg-foreground/90 transition-all cursor-pointer select-none shadow-sm active:scale-[0.98]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Dispatch Trip
                  </button>

                  <button
                    onClick={handleSimulateGrounding}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border/80 hover:bg-muted text-xs font-bold text-foreground transition-all cursor-pointer select-none shadow-xs active:scale-[0.98]"
                  >
                    <Wrench className="w-3.5 h-3.5" /> Ground Unit
                  </button>
                </div>

                {/* Utilization indicator */}
                <div className="mt-5 pt-4 border-t border-border/30">
                  <div className="flex items-center justify-between mb-2 text-xs font-mono">
                    <span className="font-semibold text-muted-foreground">Fleet Utilization</span>
                    <span className="font-bold text-foreground">
                      {((activeVehicles / (activeVehicles + groundedUnits)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      animate={{ width: `${(activeVehicles / (activeVehicles + groundedUnits)) * 100}%` }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  </div>
                </div>

              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
