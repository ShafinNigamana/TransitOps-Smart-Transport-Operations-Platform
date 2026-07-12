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
import { driverColumns } from "@/components/drivers/driver-columns";
import { DriverForm } from "@/components/drivers/driver-form";
import type { Driver, DriverStatus } from "@/types/database";
import { suspendDriver } from "@/lib/actions/drivers";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Users,
  SlidersHorizontal,
  X,
  Loader2,
  Ban,
} from "lucide-react";

import { toast } from "sonner";

interface DriverTableProps {
  initialDrivers: Driver[];
}

const DRIVER_STATUSES: { value: DriverStatus | "all"; label: string; color: string }[] = [
  { value: "all", label: "All Statuses", color: "bg-muted-foreground" },
  { value: "available", label: "Available", color: "bg-fleet-sage" },
  { value: "on_trip", label: "On Trip", color: "bg-fleet-amber" },
  { value: "off_duty", label: "Off Duty", color: "bg-muted-foreground" },
  { value: "suspended", label: "Suspended", color: "bg-fleet-ochre" },
];

const PAGE_SIZE = 10;

export function DriverTable({ initialDrivers }: DriverTableProps) {
  const [drivers, setDrivers] = React.useState<Driver[]>(initialDrivers);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<DriverStatus | "all">("all");
  const [showFilters, setShowFilters] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const [formOpen, setFormOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  // Sync state with server component updates
  React.useEffect(() => {
    setDrivers(initialDrivers);
  }, [initialDrivers]);

  // Filter logic
  const filtered = React.useMemo(() => {
    return drivers.filter((d) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesSearch =
          d.full_name.toLowerCase().includes(q) ||
          d.license_number.toLowerCase().includes(q) ||
          d.license_category.toLowerCase().includes(q) ||
          d.contact_number.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      return true;
    });
  }, [drivers, search, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedDrivers = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page on filter change
  React.useEffect(() => {
    setPage(0);
  }, [search, statusFilter]);

  // Status counts
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: drivers.length };
    for (const d of drivers) {
      counts[d.status] = (counts[d.status] || 0) + 1;
    }
    return counts;
  }, [drivers]);

  const activeFilterCount = statusFilter !== "all" ? 1 : 0;

  const handleSuspendDriver = (driverId: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await suspendDriver(driverId);
      if (res.success) {
        toast.success("Driver status set to suspended");
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Users className="h-5 w-5" />
            </div>
            Driver Management
            {isPending && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Manage fleet drivers — {drivers.length} drivers registered
          </p>
        </div>

        <Button
          onClick={() => setFormOpen(true)}
          className="shrink-0 font-semibold shadow-sm cursor-pointer"
          disabled={isPending}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Driver
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search driver name, license #, contact..."
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
              <span className="ml-1 rounded-full bg-fleet-amber px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
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
              {DRIVER_STATUSES.map((status) => {
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

          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setStatusFilter("all");
              }}
              className="text-xs font-medium text-fleet-amber hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
              {driverColumns.map((col) => (
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
            {paginatedDrivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={driverColumns.length + 1} className="h-48">
                  <EmptyState
                    icon={Users}
                    title="No drivers found"
                    description={
                      search || statusFilter !== "all"
                        ? "Try adjusting your search or filters."
                        : "Register your first driver to get started."
                    }
                    ctaLabel={!(search || statusFilter !== "all") ? "Register Driver" : undefined}
                    onCtaClick={!(search || statusFilter !== "all") ? () => setFormOpen(true) : undefined}
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedDrivers.map((driver) => (
                <TableRow
                  key={driver.id}
                  className="group cursor-pointer transition-colors"
                >
                  {driverColumns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render
                        ? col.render(driver)
                        : String(driver[col.key as keyof Driver] ?? "—")}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    {driver.status === "suspended" ? (
                      <span className="text-xs text-rose-500 font-semibold">Suspended</span>
                    ) : driver.status === "on_trip" ? (
                      <span className="text-xs text-neutral-400 italic" title="Cannot suspend driver currently on a trip">
                        On active trip
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSuspendDriver(driver.id);
                        }}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-rose-500/20 hover:border-rose-500/30 gap-1 h-7 px-2.5 cursor-pointer"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Suspend
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
              <span className="font-semibold text-neutral-700 dark:text-neutral-200">{filtered.length}</span> drivers
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

      {/* Driver Form Modal */}
      <DriverForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
