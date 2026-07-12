"use client";

import * as React from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { vehicleColumns } from "@/components/vehicles/vehicle-columns";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import type { Vehicle, VehicleStatus } from "@/types/database";
import { retireVehicle } from "@/lib/actions/vehicles";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Truck,
  SlidersHorizontal,
  X,
  Loader2,
  Trash2,
} from "lucide-react";

import { toast } from "sonner";

interface VehicleTableProps {
  initialVehicles: Vehicle[];
}

const VEHICLE_STATUSES: { value: VehicleStatus | "all"; label: string; color: string }[] = [
  { value: "all", label: "All", color: "bg-neutral-500" },
  { value: "available", label: "Available", color: "bg-emerald-500" },
  { value: "on_trip", label: "On Trip", color: "bg-blue-500" },
  { value: "in_shop", label: "In Shop", color: "bg-amber-500" },
  { value: "retired", label: "Retired", color: "bg-neutral-400" },
];

const REGIONS = [
  "All Regions",
  "North Corridor",
  "South Corridor",
  "East Port Express",
  "West Coast Route",
  "Central Hub",
  "Southern Coastal",
];

const PAGE_SIZE = 10;

export function VehicleTable({ initialVehicles }: VehicleTableProps) {
  const [vehicles, setVehicles] = React.useState<Vehicle[]>(initialVehicles);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<VehicleStatus | "all">("all");
  const [regionFilter, setRegionFilter] = React.useState("All Regions");
  const [showFilters, setShowFilters] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const [formOpen, setFormOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  // Sync state with server component updates
  React.useEffect(() => {
    setVehicles(initialVehicles);
  }, [initialVehicles]);

  // Filter logic
  const filtered = React.useMemo(() => {
    return vehicles.filter((v) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesSearch =
          v.registration_number.toLowerCase().includes(q) ||
          v.name.toLowerCase().includes(q) ||
          v.vehicle_type.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (regionFilter !== "All Regions" && v.region !== regionFilter) return false;
      return true;
    });
  }, [vehicles, search, statusFilter, regionFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedVehicles = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page on filter change
  React.useEffect(() => {
    setPage(0);
  }, [search, statusFilter, regionFilter]);

  // Status counts for filter pills
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: vehicles.length };
    for (const v of vehicles) {
      counts[v.status] = (counts[v.status] || 0) + 1;
    }
    return counts;
  }, [vehicles]);

  const activeFilterCount = (statusFilter !== "all" ? 1 : 0) + (regionFilter !== "All Regions" ? 1 : 0);

  const handleRetireVehicle = (vehicleId: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await retireVehicle(vehicleId);
      if (res.success) {
        toast.success("Vehicle status set to retired");
      } else {
        toast.error(res.error.message);
        setErrorMessage(res.error.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-700 dark:text-rose-300">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Truck className="h-5 w-5" />
            </div>
            Vehicle Registry
            {isPending && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Manage your fleet — {vehicles.length} vehicles registered
          </p>
        </div>

        <Button
          onClick={() => setFormOpen(true)}
          className="shrink-0 font-semibold shadow-sm cursor-pointer"
          disabled={isPending}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Vehicle
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search vehicle model, reg #, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`gap-1.5 cursor-pointer ${showFilters ? "bg-neutral-100 dark:bg-neutral-800" : ""}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 p-4 space-y-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-2.5">
              Status
            </span>
            <div className="flex flex-wrap gap-1.5">
              {VEHICLE_STATUSES.map((status) => {
                const count = statusCounts[status.value] ?? 0;
                const isActive = statusFilter === status.value;
                return (
                  <button
                    key={status.value}
                    onClick={() => setStatusFilter(status.value)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-sm"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${status.color}`} />
                    {status.label}
                    <span className="text-[10px] opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-2.5">
              Region
            </span>
            <div className="flex flex-wrap gap-1.5">
              {REGIONS.map((r) => {
                const isActive = regionFilter === r;
                return (
                  <button
                    key={r}
                    onClick={() => setRegionFilter(r)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-sm"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setRegionFilter("All Regions");
              }}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
              {vehicleColumns.map((col) => (
                <TableHead
                  key={col.key}
                  className={`text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 ${col.className ?? ""}`}
                >
                  {col.label}
                </TableHead>
              ))}
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={vehicleColumns.length + 1} className="h-48">
                  <EmptyState
                    icon={Truck}
                    title="No vehicles found"
                    description={
                      search || statusFilter !== "all" || regionFilter !== "All Regions"
                        ? "Try adjusting your search or filters."
                        : "Register your first vehicle to get started."
                    }
                    ctaLabel={!(search || statusFilter !== "all" || regionFilter !== "All Regions") ? "Register Vehicle" : undefined}
                    onCtaClick={!(search || statusFilter !== "all" || regionFilter !== "All Regions") ? () => setFormOpen(true) : undefined}
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedVehicles.map((vehicle) => (
                <TableRow
                  key={vehicle.id}
                  className="group cursor-pointer transition-colors"
                >
                  {vehicleColumns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render
                        ? col.render(vehicle)
                        : String(vehicle[col.key as keyof Vehicle] ?? "—")}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    {vehicle.status === "retired" ? (
                      <span className="text-xs text-neutral-400 italic">Retired</span>
                    ) : vehicle.status === "on_trip" ? (
                      <span className="text-xs text-neutral-400 italic" title="Cannot retire vehicle currently on a trip">
                        On active trip
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRetireVehicle(vehicle.id);
                        }}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-rose-500/20 hover:border-rose-500/30 gap-1 h-7 px-2.5 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Retire
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 px-4 py-3 text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
              <span className="font-semibold text-neutral-700 dark:text-neutral-200">{filtered.length}</span> vehicles
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 w-8 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    page === i
                      ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                      : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 w-8 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Vehicle Form Modal */}
      <VehicleForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
