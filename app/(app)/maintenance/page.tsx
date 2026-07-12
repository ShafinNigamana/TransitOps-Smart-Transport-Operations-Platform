import React, { Suspense } from "react";
import { Metadata } from "next";
import { MaintenanceView } from "@/components/maintenance/maintenance-view";
import { TableSkeleton } from "@/components/shared/loading-skeletons";
import { createClient } from "@/lib/supabase/server";
import type { MaintenanceRecord, Vehicle } from "@/types/database";

export const metadata: Metadata = {
  title: "Maintenance | TransitOps",
  description:
    "Log maintenance records, inspect repair tickets, and manage shop availability.",
};

export const revalidate = 0; // Disable static cache for live data updates

async function MaintenanceContent() {
  const supabase = await createClient();

  const [recordsRes, vehiclesRes, userRes] = await Promise.all([
    supabase
      .from("maintenance")
      .select("*, vehicle:vehicles(*)")
      .order("opened_at", { ascending: false }),
    supabase.from("vehicles").select("*").order("name"),
    supabase.auth.getUser(),
  ]);

  const records = (recordsRes.data ?? []) as MaintenanceRecord[];
  const vehicles = (vehiclesRes.data ?? []) as Vehicle[];
  const userRole = userRes.data.user?.user_metadata?.role || "driver";

  return (
    <MaintenanceView
      initialRecords={records}
      initialVehicles={vehicles}
      userRole={userRole}
    />
  );
}

export default function MaintenancePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<TableSkeleton />}>
        <MaintenanceContent />
      </Suspense>
    </div>
  );
}
