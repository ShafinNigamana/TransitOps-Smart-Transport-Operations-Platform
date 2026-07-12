import type {
  VehicleStatus,
  DriverStatus,
  TripStatus,
  MaintenanceStatus,
} from "@/types/database";

type AnyStatus = VehicleStatus | DriverStatus | TripStatus | MaintenanceStatus;

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  // Vehicle + Driver shared
  available: { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Available" },
  on_trip: { bg: "bg-blue-500/10", text: "text-blue-500", label: "On Trip" },
  // Vehicle-specific
  in_shop: { bg: "bg-amber-500/10", text: "text-amber-500", label: "In Shop" },
  retired: { bg: "bg-zinc-500/10", text: "text-zinc-400", label: "Retired" },
  // Driver-specific
  off_duty: { bg: "bg-zinc-500/10", text: "text-zinc-400", label: "Off Duty" },
  suspended: { bg: "bg-red-500/10", text: "text-red-500", label: "Suspended" },
  // Trip-specific
  draft: { bg: "bg-zinc-500/10", text: "text-zinc-400", label: "Draft" },
  dispatched: { bg: "bg-blue-500/10", text: "text-blue-500", label: "Dispatched" },
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Completed" },
  cancelled: { bg: "bg-red-500/10", text: "text-red-500", label: "Cancelled" },
  // Maintenance-specific
  open: { bg: "bg-amber-500/10", text: "text-amber-500", label: "Open" },
  closed: { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Closed" },
};

export function StatusBadge({ status }: { status: AnyStatus }) {
  const style = statusStyles[status] ?? {
    bg: "bg-zinc-500/10",
    text: "text-zinc-400",
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}
