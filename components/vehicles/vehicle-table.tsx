"use client";

import * as React from "react";
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
import { MOCK_VEHICLES } from "@/lib/mock-data";
import type { Vehicle, VehicleStatus } from "@/types/database";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Truck,
  SlidersHorizontal,
  X,
} from "lucide-react";

const VEHICLE_STATUSES: { value: VehicleStatus | "all"; label: string; color: string }[] = [
  { value: "all", label: "All", color: "bg-neutral-500" },
  { value: "available", label: "Available", color: "bg-emerald-500" },
  { value: "on_trip", label: "On Trip", color: "bg-blue-500" },
  { value: "in_shop", label: "In Shop", color: "bg-amber-500" },
  { value: "retired", label: "Retired", color: "bg-neutral-400" },
];

const REGIONS = ["All Regions", "North Corridor", "South Corridor", "East Port Express", "West Coast Route", "Central Hub", "Southern Coastal"];

const PAGE_SIZE = 10;

export function VehicleTable() {
  const [vehicles] = React.useState<Vehicle[]>(MOCK_VEHICLES);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<VehicleStatus | "all">("all");
  const [regionFilter, setRegionFilter] = React.useState("All Regions");
  const [showFilters, setShowFilters] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const [formOpen, setFormOpen] = React.useState(false);

  // Filter logic
  const filtered = React.useMemo(() => {
    return vehicles.filter((v) => {
      // Search across reg number, name, type
      if (search) {
        const q = search.toLowerCase();
        const matchesSearch =
          v.registration_number.toLowerCase().includes(q) ||
          v.name.toLowerCase().includes(q) ||
          v.vehicle_type.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      // Status filter
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      // Region filter
      if (regionFilter !== "All Regions" && v.region !== regionFilter) return false;
      return true;
    });
  }, [vehicles, search, statusFilter, regionFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedVehicles = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page on filter change
  React.useEffect(() => { setPage(0); }, [search, statusFilter, regionFilter]);

  // Status counts for filter pills
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: vehicles.length };
    for (const v of vehicles) {
      counts[v.status] = (counts[v.status] || 0) + 1;
    }
    return counts;
  }, [vehicles]);

  const activeFilterCount = (statusFilter !== "all" ? 1 : 0) + (regionFilter !== "All Regions" ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Truck className="h-5 w-5" />
            </div>
            Vehicle Registry
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Manage your fleet — {vehicles.length} vehicles registered
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          New Vehicle
        </Button>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search by plate, model, or type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-neutral-400" />
            </button>
          )}
        </div>

        <Button
          variant={showFilters ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Expandable Filter Panel */}
      {showFilters && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Status Filter Pills */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2.5">
              Status
            </p>
            <div className="flex flex-wrap gap-2">
              {VEHICLE_STATUSES.map((s) => {
                const isActive = statusFilter === s.value;
                return (
                  <button
                    key={s.value}
                    onClick={() => setStatusFilter(s.value)}
                    className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-sm"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${s.color}`} />
                    {s.label}
                    <span className="tabular-nums opacity-70">{statusCounts[s.value] ?? 0}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Region Filter */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2.5">
              Region
            </p>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => {
                const isActive = regionFilter === r;
                return (
                  <button
                    key={r}
                    onClick={() => setRegionFilter(r)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 ${
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

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setRegionFilter("All Regions");
              }}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={vehicleColumns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-neutral-400 dark:text-neutral-500">
                    <Truck className="h-8 w-8 opacity-50" />
                    <p className="text-sm font-medium">No vehicles found</p>
                    <p className="text-xs">
                      {search || statusFilter !== "all" || regionFilter !== "All Regions"
                        ? "Try adjusting your search or filters."
                        : "Register your first vehicle to get started."}
                    </p>
                  </div>
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
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
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
                className="h-8 w-8"
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
