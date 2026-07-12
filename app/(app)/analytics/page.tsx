import React from "react";
import { Metadata } from "next";
import { AnalyticsView } from "@/components/analytics/analytics-view";
import {
  getFleetAnalyticsSummary,
  type FleetAnalyticsSummary,
} from "@/lib/actions/analytics";

export const metadata: Metadata = {
  title: "Analytics | TransitOps",
  description:
    "Fleet analytics dashboard — fuel efficiency, operational costs, vehicle ROI, and utilization metrics.",
};

export const revalidate = 0;

// Fallback mock data for demo when Supabase is empty
const MOCK_ANALYTICS: FleetAnalyticsSummary = {
  fuelEfficiency: [
    {
      vehicle_id: "v1",
      registration_number: "KA-01-EQ-9988",
      vehicle_name: "Volvo FH16",
      total_distance_km: 2800,
      total_fuel_l: 890,
      fuel_efficiency: 3.15,
    },
    {
      vehicle_id: "v2",
      registration_number: "MH-12-TR-4421",
      vehicle_name: "Freightliner Cascadia",
      total_distance_km: 1950,
      total_fuel_l: 620,
      fuel_efficiency: 3.15,
    },
    {
      vehicle_id: "v3",
      registration_number: "DL-04-HV-1109",
      vehicle_name: "Kenworth T680",
      total_distance_km: 3200,
      total_fuel_l: 1050,
      fuel_efficiency: 3.05,
    },
    {
      vehicle_id: "v4",
      registration_number: "GJ-06-LX-7733",
      vehicle_name: "Peterbilt 579",
      total_distance_km: 1200,
      total_fuel_l: 380,
      fuel_efficiency: 3.16,
    },
    {
      vehicle_id: "v5",
      registration_number: "TN-09-EX-5502",
      vehicle_name: "Isuzu Giga",
      total_distance_km: 392,
      total_fuel_l: 124,
      fuel_efficiency: 3.16,
    },
  ],
  operationalCosts: [
    {
      vehicle_id: "v1",
      registration_number: "KA-01-EQ-9988",
      vehicle_name: "Volvo FH16",
      maintenance_cost: 1250,
      fuel_cost: 2400,
      other_expenses: 320,
      total_operational_cost: 3970,
    },
    {
      vehicle_id: "v2",
      registration_number: "MH-12-TR-4421",
      vehicle_name: "Freightliner Cascadia",
      maintenance_cost: 0,
      fuel_cost: 1680,
      other_expenses: 180,
      total_operational_cost: 1860,
    },
    {
      vehicle_id: "v3",
      registration_number: "DL-04-HV-1109",
      vehicle_name: "Kenworth T680",
      maintenance_cost: 3450,
      fuel_cost: 2840,
      other_expenses: 450,
      total_operational_cost: 6740,
    },
    {
      vehicle_id: "v4",
      registration_number: "GJ-06-LX-7733",
      vehicle_name: "Peterbilt 579",
      maintenance_cost: 890,
      fuel_cost: 1020,
      other_expenses: 95,
      total_operational_cost: 2005,
    },
    {
      vehicle_id: "v5",
      registration_number: "TN-09-EX-5502",
      vehicle_name: "Isuzu Giga",
      maintenance_cost: 620,
      fuel_cost: 340,
      other_expenses: 60,
      total_operational_cost: 1020,
    },
  ],
  vehicleROI: [
    {
      vehicle_id: "v1",
      registration_number: "KA-01-EQ-9988",
      vehicle_name: "Volvo FH16",
      acquisition_cost: 165000,
      revenue: 0,
      maintenance_cost: 1250,
      fuel_cost: 2400,
      other_expenses: 320,
      total_operational_cost: 3970,
      roi: -0.0221,
    },
    {
      vehicle_id: "v2",
      registration_number: "MH-12-TR-4421",
      vehicle_name: "Freightliner Cascadia",
      acquisition_cost: 140000,
      revenue: 0,
      maintenance_cost: 0,
      fuel_cost: 1680,
      other_expenses: 180,
      total_operational_cost: 1860,
      roi: -0.012,
    },
    {
      vehicle_id: "v3",
      registration_number: "DL-04-HV-1109",
      vehicle_name: "Kenworth T680",
      acquisition_cost: 125000,
      revenue: 0,
      maintenance_cost: 3450,
      fuel_cost: 2840,
      other_expenses: 450,
      total_operational_cost: 6740,
      roi: -0.0503,
    },
    {
      vehicle_id: "v4",
      registration_number: "GJ-06-LX-7733",
      vehicle_name: "Peterbilt 579",
      acquisition_cost: 172000,
      revenue: 0,
      maintenance_cost: 890,
      fuel_cost: 1020,
      other_expenses: 95,
      total_operational_cost: 2005,
      roi: -0.0111,
    },
    {
      vehicle_id: "v5",
      registration_number: "TN-09-EX-5502",
      vehicle_name: "Isuzu Giga",
      acquisition_cost: 88000,
      revenue: 0,
      maintenance_cost: 620,
      fuel_cost: 340,
      other_expenses: 60,
      total_operational_cost: 1020,
      roi: -0.0109,
    },
  ],
  totalFuelCost: 8280,
  totalMaintenanceCost: 6210,
  totalOtherExpenses: 1105,
  totalOperationalCost: 15595,
  avgFuelEfficiency: 3.12,
  fleetUtilizationPct: 77.27,
};

export default async function AnalyticsPage() {
  const result = await getFleetAnalyticsSummary();

  // Use live data if available; fall back to rich mock data for demo
  const analytics: FleetAnalyticsSummary =
    result.success && result.data.operationalCosts.length > 0
      ? result.data
      : MOCK_ANALYTICS;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <AnalyticsView data={analytics} />
    </div>
  );
}
