import React from "react";
import { Metadata } from "next";
import { MaintenanceView } from "@/components/maintenance/maintenance-view";

export const metadata: Metadata = {
  title: "Maintenance | TransitOps",
  description:
    "Log maintenance records, inspect repair tickets, and manage shop availability.",
};

export default function MaintenancePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <MaintenanceView />
    </div>
  );
}
