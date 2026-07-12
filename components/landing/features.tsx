"use client";

import { motion } from "framer-motion";
import {
  ShieldAlert,
  Scale,
  Wrench,
  IndianRupee,
  BarChart3,
  Users,
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: string;
  iconColor: string;
  delay: number;
}

const features: FeatureCardProps[] = [
  {
    icon: <Scale className="w-5 h-5" />,
    title: "Cargo Capacity Guard",
    description:
      "Automated pre-dispatch verification checking load weights directly against vehicle.max_capacity_kg, preventing overweight dispatch runs before they leave the yard.",
    badge: "Constraint Enforced",
    iconColor: "text-accent bg-accent/10 border-accent/20",
    delay: 0.05,
  },
  {
    icon: <ShieldAlert className="w-5 h-5" />,
    title: "30-Day License Compliance",
    description:
      "Automatic driver compliance filtering. Triggers visual warning indicators and prevents trip assignment for any driver with less than 30 days of license validity.",
    badge: "Safety Rule",
    iconColor: "text-fleet-ochre bg-fleet-ochre/10 border-fleet-ochre/20",
    delay: 0.1,
  },
  {
    icon: <Wrench className="w-5 h-5" />,
    title: "Automated Grounding Flow",
    description:
      "When a maintenance ticket is opened, the vehicle status automatically transitions to in_shop. Instantly grounds the vehicle and hides it from the dispatch queue.",
    badge: "Status Workflow",
    iconColor: "text-fleet-red bg-fleet-red/10 border-fleet-red/20",
    delay: 0.15,
  },
  {
    icon: <IndianRupee className="w-5 h-5" />,
    title: "Rupee Currency & Expense",
    description:
      "Track and audit all expenses in ₹ INR. Links fuel logs, maintenance tickets, and tolls directly to trips to calculate exact run costs.",
    badge: "Financial Engine",
    iconColor: "text-primary bg-primary/10 border-primary/20",
    delay: 0.2,
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Operational Cost Analytics",
    description:
      "Calculates fuel efficiency (km/L) and Cost-per-Kilometer metrics in real time. Generates clean, vector-based PDF and CSV reports for operations reviews.",
    badge: "Data Exports",
    iconColor: "text-fleet-sage bg-fleet-sage/10 border-fleet-sage/20",
    delay: 0.25,
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Isolated RBAC Workflows",
    description:
      "Strict role-based access control. Dynamically generates interfaces and restricts data visibility for Managers, Drivers, Safety Officers, and Financial Analysts.",
    badge: "Access Security",
    iconColor: "text-accent bg-accent/10 border-accent/20",
    delay: 0.3,
  },
];

function FeatureCard({ icon, title, description, badge, iconColor, delay }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay }}
      className="group relative"
    >
      <div className="h-full p-6 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 shadow-[0_2px_8px_rgba(0,0,0,0.015)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-all duration-300 flex flex-col justify-between">
        <div>
          {/* Header & Icon */}
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${iconColor} border`}>
              {icon}
            </div>
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/30">
              {badge}
            </span>
          </div>

          {/* Title & Desc */}
          <h3 className="text-base font-bold text-foreground mb-2 tracking-tight group-hover:text-primary transition-colors font-sans">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
            {description}
          </p>
        </div>

        {/* Micro-Interaction Line */}
        <div className="mt-4 pt-4 border-t border-border/20 flex items-center justify-end">
          <span className="text-[11px] font-mono font-bold text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
            System Constraint
            <span className="translate-x-0 group-hover:translate-x-0.5 transition-transform">→</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32 bg-background border-t border-border/30">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-left mb-16 max-w-2xl">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-mono font-bold uppercase tracking-wider mb-4">
            Core Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-display mb-4">
            Built for High-Precision Operations.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-sans">
            Every business rule, cargo validation constraint, and role-based workflow is enforced natively by our local intelligence architecture.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>

      </div>
    </section>
  );
}
