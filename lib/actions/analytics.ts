"use server";

import { createClient } from "@/lib/supabase/server";
import { calculateFleetUtilization } from "@/lib/utils";
import type { ActionResult, FleetKPIs } from "@/types/database";

export async function getFleetKPIs(): Promise<ActionResult<FleetKPIs>> {
  const supabase = await createClient();

  // Vehicle status counts
  const { data: vehicles, error: vErr } = await supabase
    .from("vehicles")
    .select("status");

  if (vErr) {
    return {
      success: false,
      error: { code: "QUERY_ERROR", message: "Failed to fetch vehicle data." },
    };
  }

  const vehicleRows = vehicles ?? [];
  const totalVehicles = vehicleRows.length;
  const activeVehicles = vehicleRows.filter((v) => v.status === "on_trip").length;
  const availableVehicles = vehicleRows.filter((v) => v.status === "available").length;
  const vehiclesInMaintenance = vehicleRows.filter((v) => v.status === "in_shop").length;
  const retiredVehicles = vehicleRows.filter((v) => v.status === "retired").length;
  const totalNonRetired = totalVehicles - retiredVehicles;

  // Trip status counts
  const { data: trips, error: tErr } = await supabase
    .from("trips")
    .select("status");

  if (tErr) {
    return {
      success: false,
      error: { code: "QUERY_ERROR", message: "Failed to fetch trip data." },
    };
  }

  const tripRows = trips ?? [];
  const activeTrips = tripRows.filter((t) => t.status === "dispatched").length;
  const pendingTrips = tripRows.filter((t) => t.status === "draft").length;

  // Driver status counts
  const { data: drivers, error: dErr } = await supabase
    .from("drivers")
    .select("status");

  if (dErr) {
    return {
      success: false,
      error: { code: "QUERY_ERROR", message: "Failed to fetch driver data." },
    };
  }

  const driverRows = drivers ?? [];
  const driversOnDuty = driverRows.filter((d) => d.status === "on_trip").length;
  const totalDrivers = driverRows.length;

  const fleetUtilizationPct = calculateFleetUtilization(activeVehicles, totalNonRetired);

  return {
    success: true,
    data: {
      totalVehicles,
      activeVehicles,
      availableVehicles,
      vehiclesInMaintenance,
      retiredVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      totalDrivers,
      fleetUtilizationPct,
    },
  };
}

export interface RecentTripRow {
  id: string;
  source: string;
  destination: string;
  status: string;
  created_at: string;
  dispatched_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  vehicle: { registration_number: string; name: string } | null;
  driver: { full_name: string } | null;
}

export async function getRecentTrips(): Promise<ActionResult<RecentTripRow[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trips")
    .select(
      "id, source, destination, status, created_at, dispatched_at, completed_at, cancelled_at, vehicle:vehicles(registration_number, name), driver:drivers(full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return {
      success: false,
      error: { code: "QUERY_ERROR", message: "Failed to fetch recent trips." },
    };
  }

  return { success: true, data: (data ?? []) as unknown as RecentTripRow[] };
}
