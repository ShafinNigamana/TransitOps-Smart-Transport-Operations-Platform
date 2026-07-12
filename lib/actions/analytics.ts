"use server";

import { pool } from "@/lib/db";
import { calculateFleetUtilization } from "@/lib/utils";
import type { ActionResult, FleetKPIs } from "@/types/database";
import { cookies } from "next/headers";

export async function getFleetKPIs(): Promise<ActionResult<FleetKPIs>> {
  try {
    const sessionCookie = (await cookies()).get("transitops_session");
    let userRole = "driver";
    let fullName = "";
    let userEmail = "";
    if (sessionCookie && sessionCookie.value) {
      const payload = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf8"));
      userRole = payload.userRole || "driver";
      fullName = payload.fullName || "";
      userEmail = payload.email || "";
    }

    let driverId: string | null = null;
    if (userRole === "driver") {
      const dRes = await pool.query("SELECT id FROM public.drivers WHERE full_name = $1", [fullName]);
      if (dRes.rows.length > 0) {
        driverId = dRes.rows[0].id;
      } else if (fullName === "Driver" || userEmail === "driver@transitops.com") {
        driverId = "22222222-2222-2222-2222-222222222222";
      }
    }

    const vRes = await pool.query("SELECT id, status FROM public.vehicles");
    let vehicleRows = vRes.rows;

    const tRes = await pool.query("SELECT id, vehicle_id, driver_id, status FROM public.trips");
    let tripRows = tRes.rows;

    const drRes = await pool.query("SELECT id, status FROM public.drivers");
    let driverRows = drRes.rows;

    if (userRole === "driver" && driverId) {
      // Filter trips to only their own
      tripRows = tripRows.filter((t: any) => t.driver_id === driverId);
      // Filter vehicles to only ones they have driven/are driving
      const myVehicleIds = new Set(tripRows.map((t: any) => t.vehicle_id));
      vehicleRows = vehicleRows.filter((v: any) => myVehicleIds.has(v.id));
      // Filter drivers to only themself
      driverRows = driverRows.filter((d: any) => d.id === driverId);
    }

    const totalVehicles = vehicleRows.length;
    const activeVehicles = vehicleRows.filter((v: any) => v.status === "on_trip").length;
    const availableVehicles = vehicleRows.filter((v: any) => v.status === "available").length;
    const vehiclesInMaintenance = vehicleRows.filter((v: any) => v.status === "in_shop").length;
    const retiredVehicles = vehicleRows.filter((v: any) => v.status === "retired").length;
    const totalNonRetired = totalVehicles - retiredVehicles;

    const activeTrips = tripRows.filter((t: any) => t.status === "dispatched").length;
    const pendingTrips = tripRows.filter((t: any) => t.status === "draft").length;

    const driversOnDuty = driverRows.filter((d: any) => d.status === "on_trip").length;
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
  } catch (error: any) {
    return {
      success: false,
      error: { code: "QUERY_ERROR", message: error.message || "Failed to fetch fleet KPIs." },
    };
  }
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
  try {
    const sessionCookie = (await cookies()).get("transitops_session");
    let userRole = "driver";
    let fullName = "";
    let userEmail = "";
    if (sessionCookie && sessionCookie.value) {
      const payload = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf8"));
      userRole = payload.userRole || "driver";
      fullName = payload.fullName || "";
      userEmail = payload.email || "";
    }

    let driverId: string | null = null;
    if (userRole === "driver") {
      const dRes = await pool.query("SELECT id FROM public.drivers WHERE full_name = $1", [fullName]);
      if (dRes.rows.length > 0) {
        driverId = dRes.rows[0].id;
      } else if (fullName === "Driver" || userEmail === "driver@transitops.com") {
        driverId = "22222222-2222-2222-2222-222222222222";
      }
    }

    let queryStr = `
      SELECT t.id, t.source, t.destination, t.status, t.created_at, t.dispatched_at, t.completed_at, t.cancelled_at,
             row_to_json(v) AS vehicle,
             row_to_json(d) AS driver
      FROM public.trips t
      LEFT JOIN public.vehicles v ON t.vehicle_id = v.id
      LEFT JOIN public.drivers d ON t.driver_id = d.id
    `;
    let queryParams: any[] = [];

    if (userRole === "driver" && driverId) {
      queryStr += " WHERE t.driver_id = $1 ";
      queryParams.push(driverId);
    }

    queryStr += " ORDER BY t.created_at DESC LIMIT 10 ";

    const dbRes = await pool.query(queryStr, queryParams);
    return { success: true, data: dbRes.rows as unknown as RecentTripRow[] };
  } catch (error: any) {
    return {
      success: false,
      error: { code: "QUERY_ERROR", message: error.message || "Failed to fetch recent trips." },
    };
  }
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
  try {
    const sessionCookie = (await cookies()).get("transitops_session");
    let userRole = "driver";
    let fullName = "";
    let userEmail = "";
    if (sessionCookie && sessionCookie.value) {
      const payload = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf8"));
      userRole = payload.userRole || "driver";
      fullName = payload.fullName || "";
      userEmail = payload.email || "";
    }

    let driverId: string | null = null;
    if (userRole === "driver") {
      const dRes = await pool.query("SELECT id FROM public.drivers WHERE full_name = $1", [fullName]);
      if (dRes.rows.length > 0) {
        driverId = dRes.rows[0].id;
      } else if (fullName === "Driver" || userEmail === "driver@transitops.com") {
        driverId = "22222222-2222-2222-2222-222222222222";
      }
    }

    const vRes = await pool.query("SELECT id, registration_number, name, status, acquisition_cost FROM public.vehicles");
    let vehicleRows = vRes.rows;

    let tripQuery = "SELECT id, vehicle_id, driver_id, actual_distance_km, fuel_consumed_l FROM public.trips WHERE status = 'completed'";
    let tripParams: any[] = [];
    if (userRole === "driver" && driverId) {
      tripQuery = "SELECT id, vehicle_id, driver_id, actual_distance_km, fuel_consumed_l FROM public.trips WHERE status = 'completed' AND driver_id = $1";
      tripParams.push(driverId);
    }
    const tRes = await pool.query(tripQuery, tripParams);
    const tripRows = tRes.rows;

    if (userRole === "driver" && driverId) {
      const myVehicleIds = new Set(tripRows.map((t: any) => t.vehicle_id));
      vehicleRows = vehicleRows.filter((v: any) => myVehicleIds.has(v.id));
    }

    const activeVehicles = vehicleRows.filter((v: any) => v.status === "on_trip").length;
    const totalNonRetired = vehicleRows.filter((v: any) => v.status !== "retired").length;
    const fleetUtilizationPct = calculateFleetUtilization(activeVehicles, totalNonRetired);

    let fuelQuery = "SELECT id, vehicle_id, trip_id, cost FROM public.fuel_logs";
    let fuelParams: any[] = [];
    if (userRole === "driver" && driverId) {
      fuelQuery = "SELECT id, vehicle_id, trip_id, cost FROM public.fuel_logs WHERE trip_id IN (SELECT id FROM public.trips WHERE driver_id = $1)";
      fuelParams.push(driverId);
    }
    const fRes = await pool.query(fuelQuery, fuelParams);
    const fuelLogRows = fRes.rows;

    let maintenanceRows: any[] = [];
    if (userRole !== "driver") {
      const mRes = await pool.query("SELECT id, vehicle_id, cost FROM public.maintenance");
      maintenanceRows = mRes.rows;
    }

    let expenseQuery = "SELECT id, vehicle_id, trip_id, amount FROM public.expenses";
    let expenseParams: any[] = [];
    if (userRole === "driver" && driverId) {
      expenseQuery = "SELECT id, vehicle_id, trip_id, amount FROM public.expenses WHERE trip_id IN (SELECT id FROM public.trips WHERE driver_id = $1)";
      expenseParams.push(driverId);
    }
    const eRes = await pool.query(expenseQuery, expenseParams);
    const expenseRows = eRes.rows;

    if (userRole === "safety_officer") {
      fuelLogRows.length = 0;
      maintenanceRows.length = 0;
      expenseRows.length = 0;
    }

    const fuelEfficiency: FuelEfficiencyRow[] = [];
    const operationalCosts: OperationalCostRow[] = [];
    const vehicleROI: VehicleROIRow[] = [];

    let totalFuelCost = 0;
    let totalMaintenanceCost = 0;
    let totalOtherExpenses = 0;
    let totalDistanceAll = 0;
    let totalFuelAll = 0;

    for (const v of vehicleRows) {
      const vTrips = tripRows.filter((t: any) => t.vehicle_id === v.id);
      const totalDistance = vTrips.reduce((sum: number, t: any) => sum + (Number(t.actual_distance_km) || 0), 0);
      const totalFuel = vTrips.reduce((sum: number, t: any) => sum + (Number(t.fuel_consumed_l) || 0), 0);
      const efficiency = totalFuel > 0 ? Math.round((totalDistance / totalFuel) * 100) / 100 : null;

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

      const mCost = maintenanceRows.filter((m: any) => m.vehicle_id === v.id).reduce((sum: number, m: any) => sum + (Number(m.cost) || 0), 0);
      const fCost = fuelLogRows.filter((f: any) => f.vehicle_id === v.id).reduce((sum: number, f: any) => sum + (Number(f.cost) || 0), 0);
      const oCost = expenseRows.filter((e: any) => e.vehicle_id === v.id).reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
      const totalOpCost = Math.round((mCost + fCost + oCost) * 100) / 100;

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

      const revenue = 0;
      const acquisitionCost = Number(v.acquisition_cost) || 0;
      const roi = acquisitionCost > 0 ? Math.round(((revenue - (mCost + fCost)) / acquisitionCost) * 10000) / 10000 : null;

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

    const avgFuelEfficiency = totalFuelAll > 0 ? Math.round((totalDistanceAll / totalFuelAll) * 100) / 100 : null;

    return {
      success: true,
      data: {
        fuelEfficiency,
        operationalCosts,
        vehicleROI,
        totalFuelCost: Math.round(totalFuelCost * 100) / 100,
        totalMaintenanceCost: Math.round(totalMaintenanceCost * 100) / 100,
        totalOtherExpenses: Math.round(totalOtherExpenses * 100) / 100,
        totalOperationalCost: Math.round((totalFuelCost + totalMaintenanceCost + totalOtherExpenses) * 100) / 100,
        avgFuelEfficiency,
        fleetUtilizationPct,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: { code: "QUERY_ERROR", message: error.message || "Failed to fetch operational costs." },
    };
  }
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
