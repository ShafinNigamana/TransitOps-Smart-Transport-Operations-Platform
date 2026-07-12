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

// ── Analytics Reports per SYSTEM_ARCHITECTURE.md §4 ──────────────────────

export interface FuelEfficiencyRow {
  vehicle_id: string;
  registration_number: string;
  vehicle_name: string;
  total_distance_km: number;
  total_fuel_l: number;
  fuel_efficiency: number | null;
}

export interface OperationalCostRow {
  vehicle_id: string;
  registration_number: string;
  vehicle_name: string;
  maintenance_cost: number;
  fuel_cost: number;
  other_expenses: number;
  total_operational_cost: number;
}

export interface VehicleROIRow {
  vehicle_id: string;
  registration_number: string;
  vehicle_name: string;
  acquisition_cost: number;
  revenue: number;
  maintenance_cost: number;
  fuel_cost: number;
  other_expenses: number;
  total_operational_cost: number;
  roi: number | null;
}

export interface FleetAnalyticsSummary {
  fuelEfficiency: FuelEfficiencyRow[];
  operationalCosts: OperationalCostRow[];
  vehicleROI: VehicleROIRow[];
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalOtherExpenses: number;
  totalOperationalCost: number;
  avgFuelEfficiency: number | null;
  fleetUtilizationPct: number;
}

export async function getFleetAnalyticsSummary(): Promise<ActionResult<FleetAnalyticsSummary>> {
  const supabase = await createClient();

  // Fetch all vehicles (non-retired for utilization)
  const { data: vehicles, error: vErr } = await supabase
    .from("vehicles")
    .select("id, registration_number, name, status, acquisition_cost");

  if (vErr) {
    return {
      success: false,
      error: { code: "QUERY_ERROR", message: "Failed to fetch vehicles." },
    };
  }

  const vehicleRows = vehicles ?? [];
  const activeVehicles = vehicleRows.filter((v) => v.status === "on_trip").length;
  const totalNonRetired = vehicleRows.filter((v) => v.status !== "retired").length;
  const fleetUtilizationPct = calculateFleetUtilization(activeVehicles, totalNonRetired);

  // Fetch completed trips for fuel efficiency
  const { data: trips } = await supabase
    .from("trips")
    .select("vehicle_id, actual_distance_km, fuel_consumed_l")
    .eq("status", "completed");

  // Fetch fuel logs for fuel costs
  const { data: fuelLogs } = await supabase
    .from("fuel_logs")
    .select("vehicle_id, cost");

  // Fetch maintenance costs
  const { data: maintenance } = await supabase
    .from("maintenance")
    .select("vehicle_id, cost");

  // Fetch other expenses
  const { data: expenses } = await supabase
    .from("expenses")
    .select("vehicle_id, amount");

  const tripRows = trips ?? [];
  const fuelLogRows = fuelLogs ?? [];
  const maintenanceRows = maintenance ?? [];
  const expenseRows = expenses ?? [];

  // Aggregate per vehicle
  const fuelEfficiency: FuelEfficiencyRow[] = [];
  const operationalCosts: OperationalCostRow[] = [];
  const vehicleROI: VehicleROIRow[] = [];

  let totalFuelCost = 0;
  let totalMaintenanceCost = 0;
  let totalOtherExpenses = 0;
  let totalDistanceAll = 0;
  let totalFuelAll = 0;

  for (const v of vehicleRows) {
    // Fuel Efficiency (§4.1): Total Distance / Total Fuel Consumed
    const vTrips = tripRows.filter((t) => t.vehicle_id === v.id);
    const totalDistance = vTrips.reduce(
      (sum, t) => sum + (Number(t.actual_distance_km) || 0),
      0
    );
    const totalFuel = vTrips.reduce(
      (sum, t) => sum + (Number(t.fuel_consumed_l) || 0),
      0
    );
    const efficiency =
      totalFuel > 0
        ? Math.round((totalDistance / totalFuel) * 100) / 100
        : null;

    fuelEfficiency.push({
      vehicle_id: v.id,
      registration_number: v.registration_number,
      vehicle_name: v.name,
      total_distance_km: totalDistance,
      total_fuel_l: totalFuel,
      fuel_efficiency: efficiency,
    });

    totalDistanceAll += totalDistance;
    totalFuelAll += totalFuel;

    // Operational Cost (§4.2): Maintenance + Fuel + Other Expenses
    const mCost = maintenanceRows
      .filter((m) => m.vehicle_id === v.id)
      .reduce((sum, m) => sum + (Number(m.cost) || 0), 0);
    const fCost = fuelLogRows
      .filter((f) => f.vehicle_id === v.id)
      .reduce((sum, f) => sum + (Number(f.cost) || 0), 0);
    const oCost = expenseRows
      .filter((e) => e.vehicle_id === v.id)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalOpCost =
      Math.round((mCost + fCost + oCost) * 100) / 100;

    operationalCosts.push({
      vehicle_id: v.id,
      registration_number: v.registration_number,
      vehicle_name: v.name,
      maintenance_cost: mCost,
      fuel_cost: fCost,
      other_expenses: oCost,
      total_operational_cost: totalOpCost,
    });

    totalFuelCost += fCost;
    totalMaintenanceCost += mCost;
    totalOtherExpenses += oCost;

    // Vehicle ROI (§4.3): [Revenue - (Maintenance + Fuel)] / Acquisition Cost
    // Revenue = 0 fallback since schema doesn't include a revenue column (see §4.3 note)
    const revenue = 0;
    const acquisitionCost = Number(v.acquisition_cost) || 0;
    const roi =
      acquisitionCost > 0
        ? Math.round(
            ((revenue - (mCost + fCost)) / acquisitionCost) * 10000
          ) / 10000
        : null;

    vehicleROI.push({
      vehicle_id: v.id,
      registration_number: v.registration_number,
      vehicle_name: v.name,
      acquisition_cost: acquisitionCost,
      revenue,
      maintenance_cost: mCost,
      fuel_cost: fCost,
      other_expenses: oCost,
      total_operational_cost: totalOpCost,
      roi,
    });
  }

  const avgFuelEfficiency =
    totalFuelAll > 0
      ? Math.round((totalDistanceAll / totalFuelAll) * 100) / 100
      : null;

  return {
    success: true,
    data: {
      fuelEfficiency,
      operationalCosts,
      vehicleROI,
      totalFuelCost: Math.round(totalFuelCost * 100) / 100,
      totalMaintenanceCost: Math.round(totalMaintenanceCost * 100) / 100,
      totalOtherExpenses: Math.round(totalOtherExpenses * 100) / 100,
      totalOperationalCost:
        Math.round((totalFuelCost + totalMaintenanceCost + totalOtherExpenses) * 100) / 100,
      avgFuelEfficiency,
      fleetUtilizationPct,
    },
  };
}

// ── CSV Export ────────────────────────────────────────────────────────────

export async function exportFleetCSV(): Promise<ActionResult<string>> {
  const result = await getFleetAnalyticsSummary();
  if (!result.success) return result;

  const { vehicleROI } = result.data;

  const headers = [
    "Vehicle",
    "Registration",
    "Acquisition Cost",
    "Revenue",
    "Maintenance Cost",
    "Fuel Cost",
    "Other Expenses",
    "Total Operational Cost",
    "ROI",
  ];

  const rows = vehicleROI.map((v) =>
    [
      `"${v.vehicle_name}"`,
      v.registration_number,
      v.acquisition_cost.toFixed(2),
      v.revenue.toFixed(2),
      v.maintenance_cost.toFixed(2),
      v.fuel_cost.toFixed(2),
      v.other_expenses.toFixed(2),
      v.total_operational_cost.toFixed(2),
      v.roi !== null ? `${(v.roi * 100).toFixed(2)}%` : "N/A",
    ].join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  return { success: true, data: csv };
}
