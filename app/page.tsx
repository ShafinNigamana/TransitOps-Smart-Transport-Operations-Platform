import type { Metadata } from "next";
import Navbar from "@/components/landing/navbar";
import Hero from "@/components/landing/hero";
import Features from "@/components/landing/features";
import Personas from "@/components/landing/personas";
import Architecture from "@/components/landing/architecture";
import Metrics from "@/components/landing/metrics";
import Footer from "@/components/landing/footer";

export const metadata: Metadata = {
  title:
    "TransitOps — Fleet Management System | Vehicle Tracking & Trip Dispatching",
  description:
    "Operational intelligence for modern fleet logistics. Optimize vehicle dispatch, enforce driver safety compliance, automate maintenance grounding, and track fleet analytics with TransitOps — a local-first, Next.js 15 fleet management platform.",
  keywords: [
    "Fleet Management System",
    "Vehicle Tracking",
    "Trip Dispatching",
    "Logistics Operations",
    "Fleet Analytics",
    "Driver Safety Compliance",
    "Automated Maintenance Logs",
    "Cargo Capacity Guard",
    "License Expiry Alerts",
    "Vehicle Grounding Workflow",
    "Cost-per-Kilometer Metrics",
    "Fuel Efficiency",
    "Role-Based Access Control",
    "RBAC",
    "Next.js 15",
    "TypeScript",
    "PostgreSQL",
    "TransitOps",
  ],
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#020617] text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <Personas />
      <Architecture />
      <Metrics />
      <Footer />
    </main>
  );
}
