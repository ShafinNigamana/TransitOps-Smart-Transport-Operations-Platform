import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  DriverStatus,
  MaintenanceStatus,
  TripStatus,
  VehicleStatus,
} from "@/types/database";

type StatusValue =
  | VehicleStatus
  | DriverStatus
  | TripStatus
  | MaintenanceStatus
  | string;

interface StatusBadgeProps {
  status: StatusValue;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  // Amber variants (open, in_shop)
  if (normalized === "open" || normalized === "in_shop") {
    const label = normalized === "in_shop" ? "In Shop" : "Open";
    return (
      <Badge variant="warning" className={className}>
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        {label}
      </Badge>
    );
  }

  // Green variants (completed, closed, available)
  if (
    normalized === "completed" ||
    normalized === "closed" ||
    normalized === "available"
  ) {
    const label =
      normalized === "completed"
        ? "Completed"
        : normalized === "closed"
        ? "Closed"
        : "Available";
    return (
      <Badge variant="success" className={className}>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {label}
      </Badge>
    );
  }

  // Blue variants (dispatched, on_trip)
  if (normalized === "dispatched" || normalized === "on_trip") {
    const label = normalized === "on_trip" ? "On Trip" : "Dispatched";
    return (
      <Badge variant="info" className={className}>
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
        {label}
      </Badge>
    );
  }

  // Red variants (cancelled, suspended)
  if (normalized === "cancelled" || normalized === "suspended") {
    const label = normalized === "suspended" ? "Suspended" : "Cancelled";
    return (
      <Badge variant="danger" className={className}>
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        {label}
      </Badge>
    );
  }

  // Gray variants (draft, retired, off_duty)
  if (
    normalized === "draft" ||
    normalized === "retired" ||
    normalized === "off_duty"
  ) {
    const label =
      normalized === "off_duty"
        ? "Off Duty"
        : normalized.charAt(0).toUpperCase() + normalized.slice(1);
    return (
      <Badge variant="secondary" className={className}>
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
        {label}
      </Badge>
    );
  }

  // Fallback
  return (
    <Badge variant="secondary" className={className}>
      {status}
    </Badge>
  );
}
