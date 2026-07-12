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

  // Amber/Ochre variants (open, in_shop)
  if (normalized === "open" || normalized === "in_shop") {
    const label = normalized === "in_shop" ? "In Shop" : "Open";
    return (
      <Badge variant="warning" className={className}>
        <span className="h-1.5 w-1.5 rounded-full bg-fleet-ochre animate-pulse" />
        {label}
      </Badge>
    );
  }

  // Green/Sage variants (completed, closed, available)
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
        <span className="h-1.5 w-1.5 rounded-full bg-fleet-sage" />
        {label}
      </Badge>
    );
  }

  // Route Amber variants (dispatched, on_trip)
  if (normalized === "dispatched" || normalized === "on_trip") {
    const label = normalized === "on_trip" ? "On Trip" : "Dispatched";
    return (
      <Badge variant="info" className={className}>
        <span className="h-1.5 w-1.5 rounded-full bg-fleet-amber animate-pulse" />
        {label}
      </Badge>
    );
  }

  // Suspended (Ochre/Warning, desaturated)
  if (normalized === "suspended") {
    return (
      <Badge variant="warning" className={className}>
        <span className="h-1.5 w-1.5 rounded-full bg-fleet-ochre" />
        Suspended
      </Badge>
    );
  }

  // Muted gray chip (draft, retired, off_duty, cancelled)
  if (
    normalized === "draft" ||
    normalized === "retired" ||
    normalized === "off_duty" ||
    normalized === "cancelled"
  ) {
    const label =
      normalized === "off_duty"
        ? "Off Duty"
        : normalized.charAt(0).toUpperCase() + normalized.slice(1);
    return (
      <Badge variant="secondary" className={className}>
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
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
