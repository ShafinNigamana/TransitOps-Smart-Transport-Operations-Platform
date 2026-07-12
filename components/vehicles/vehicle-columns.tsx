"use client";

import * as React from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Vehicle } from "@/types/database";
import { formatCurrency, formatNumber } from "@/lib/utils";

export interface VehicleColumnDef {
  key: keyof Vehicle | "actions";
  label: string;
  className?: string;
  render?: (vehicle: Vehicle) => React.ReactNode;
}

export const vehicleColumns: VehicleColumnDef[] = [
  {
    key: "registration_number",
    label: "Reg. No.",
    className: "font-mono font-semibold text-foreground",
    render: (v) => (
      <span className="font-mono font-semibold tracking-wide text-neutral-900 dark:text-neutral-100">
        {v.registration_number}
      </span>
    ),
  },
  {
    key: "name",
    label: "Model / Name",
    render: (v) => (
      <div className="min-w-0">
        <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
          {v.name}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          {v.vehicle_type}
        </p>
      </div>
    ),
  },
  {
    key: "vehicle_type",
    label: "Type",
    render: (v) => (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300">
        {v.vehicle_type}
      </span>
    ),
  },
  {
    key: "max_load_capacity_kg",
    label: "Max Load (kg)",
    className: "text-right tabular-nums",
    render: (v) => (
      <span className="tabular-nums font-medium">
        {formatNumber(v.max_load_capacity_kg)}
      </span>
    ),
  },
  {
    key: "odometer_km",
    label: "Odometer (km)",
    className: "text-right tabular-nums",
    render: (v) => (
      <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
        {formatNumber(v.odometer_km)}
      </span>
    ),
  },
  {
    key: "acquisition_cost",
    label: "Acquisition Cost",
    className: "text-right tabular-nums",
    render: (v) => (
      <span className="tabular-nums font-medium text-neutral-700 dark:text-neutral-300">
        {formatCurrency(v.acquisition_cost)}
      </span>
    ),
  },
  {
    key: "region",
    label: "Region",
    render: (v) => (
      <span className="text-sm text-neutral-600 dark:text-neutral-400">
        {v.region || "—"}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (v) => <StatusBadge status={v.status} />,
  },
];
