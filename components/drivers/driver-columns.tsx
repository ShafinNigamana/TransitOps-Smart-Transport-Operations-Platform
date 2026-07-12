"use client";

import * as React from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import type { Driver } from "@/types/database";
import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";

export interface DriverColumnDef {
  key: keyof Driver | "license_expiry" | "actions";
  label: string;
  className?: string;
  render?: (driver: Driver) => React.ReactNode;
}

function LicenseExpiryBadge({ expiryDate }: { expiryDate: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const formattedExpiry = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(expiry);

  if (daysUntilExpiry < 0) {
    // Already expired
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm tabular-nums text-neutral-600 dark:text-neutral-400">
          {formattedExpiry}
        </span>
        <Badge variant="danger" className="w-fit">
          <ShieldAlert className="h-3 w-3" />
          Expired {Math.abs(daysUntilExpiry)}d ago
        </Badge>
      </div>
    );
  }

  if (daysUntilExpiry <= 30) {
    // Expiring within 30 days
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm tabular-nums text-neutral-600 dark:text-neutral-400">
          {formattedExpiry}
        </span>
        <Badge variant="warning" className="w-fit">
          <AlertTriangle className="h-3 w-3" />
          Expires in {daysUntilExpiry}d
        </Badge>
      </div>
    );
  }

  // Valid — plenty of time
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm tabular-nums text-neutral-600 dark:text-neutral-400">
        {formattedExpiry}
      </span>
      <Badge variant="success" className="w-fit">
        <ShieldCheck className="h-3 w-3" />
        Valid
      </Badge>
    </div>
  );
}

function SafetyScoreDisplay({ score: rawScore }: { score: number }) {
  const score = Number(rawScore) || 0;
  let color = "text-emerald-600 dark:text-emerald-400";
  let bgColor = "bg-emerald-500";
  if (score < 70) {
    color = "text-rose-600 dark:text-rose-400";
    bgColor = "bg-rose-500";
  } else if (score < 85) {
    color = "text-amber-600 dark:text-amber-400";
    bgColor = "bg-amber-500";
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden max-w-[60px]">
        <div
          className={`h-full rounded-full ${bgColor} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-sm font-semibold tabular-nums ${color}`}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

export const driverColumns: DriverColumnDef[] = [
  {
    key: "full_name",
    label: "Driver",
    render: (d) => (
      <div className="min-w-0">
        <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
          {d.full_name}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">
          {d.license_number}
        </p>
      </div>
    ),
  },
  {
    key: "license_category",
    label: "License Class",
    render: (d) => (
      <span className="inline-flex items-center rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300">
        {d.license_category}
      </span>
    ),
  },
  {
    key: "license_expiry",
    label: "License Expiry",
    render: (d) => <LicenseExpiryBadge expiryDate={d.license_expiry_date} />,
  },
  {
    key: "contact_number",
    label: "Contact",
    render: (d) => (
      <span className="text-sm text-neutral-600 dark:text-neutral-400 font-mono">
        {d.contact_number}
      </span>
    ),
  },
  {
    key: "safety_score",
    label: "Safety Score",
    render: (d) => <SafetyScoreDisplay score={d.safety_score} />,
  },
  {
    key: "status",
    label: "Status",
    render: (d) => <StatusBadge status={d.status} />,
  },
];
