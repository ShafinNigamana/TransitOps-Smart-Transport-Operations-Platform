import React from "react";
import { Metadata } from "next";
import { FuelLogsView } from "@/components/fuel-logs/fuel-logs-view";
import { createClient } from "@/lib/supabase/server";
import type { FuelLog, Vehicle, Trip } from "@/types/database";

export const metadata: Metadata = {
  title: "Fuel Logs | TransitOps",
  description:
    "Log fuel purchases, track consumption per vehicle, and link entries to trips for efficiency analysis.",
};

export const revalidate = 0;

export default async function FuelLogsPage() {
  const supabase = await createClient();

  const [logsRes, vehiclesRes, tripsRes] = await Promise.all([
    supabase
      .from("fuel_logs")
      .select("*, vehicle:vehicles(*)")
      .order("log_date", { ascending: false }),
    supabase.from("vehicles").select("*").order("name"),
    supabase
      .from("trips")
      .select("id, source, destination, vehicle_id, status")
      .order("created_at", { ascending: false }),
  ]);

  const logs = (logsRes.data ?? []) as FuelLog[];
  const vehicles = (vehiclesRes.data ?? []) as Vehicle[];
  const trips = (tripsRes.data ?? []) as Trip[];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <FuelLogsView
        initialLogs={logs}
        initialVehicles={vehicles}
        initialTrips={trips}
      />
    </div>
  );
}
