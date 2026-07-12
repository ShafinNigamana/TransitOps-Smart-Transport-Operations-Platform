import React from "react";
import { Metadata } from "next";
import { MaintenanceView } from "@/components/maintenance/maintenance-view";
import { createClient } from "@/lib/supabase/server";
import type { MaintenanceRecord, Vehicle } from "@/types/database";

export const metadata: Metadata = {
  title: "Maintenance | TransitOps",
  description:
    "Log maintenance records, inspect repair tickets, and manage shop availability.",
};

export const revalidate = 0; // Disable static cache for live data updates

export default async function MaintenancePage() {
  const supabase = await createClient();

  // Fetch dataset
  const [recordsRes, vehiclesRes] = await Promise.all([
    supabase
      .from("maintenance")
      .select("*, vehicle:vehicles(*)")
      .order("opened_at", { ascending: false }),
    supabase.from("vehicles").select("*").order("name"),
  ]);

  const records = (recordsRes.data ?? []) as MaintenanceRecord[];
  const vehicles = (vehiclesRes.data ?? []) as Vehicle[];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <MaintenanceView
        initialRecords={records}
        initialVehicles={vehicles}
      />
    </div>
  );
}
