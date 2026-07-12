"use client";

import * as React from "react";
import { Plus, Search, Fuel, Loader2 } from "lucide-react";
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
import { FuelLogForm } from "@/components/fuel-logs/fuel-log-form";
import type {
  FuelLog,
  Vehicle,
  Trip,
  CreateFuelLogInput,
} from "@/types/database";
import { createFuelLog } from "@/lib/actions/fuel-and-expenses";
import { formatCurrency, formatDate } from "@/lib/utils";

interface FuelLogsViewProps {
  initialLogs: FuelLog[];
  initialVehicles: Vehicle[];
  initialTrips: Trip[];
}

export function FuelLogsView({
  initialLogs,
  initialVehicles,
  initialTrips,
}: FuelLogsViewProps) {
  const [logs, setLogs] = React.useState<FuelLog[]>(initialLogs);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLogOpen, setIsLogOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  const handleLogFuel = (input: CreateFuelLogInput) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await createFuelLog(input);
      if (res.success) {
        setIsLogOpen(false);
      } else {
        setErrorMessage(res.error.message);
      }
    });
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.vehicle?.name?.toLowerCase().includes(q) ||
      log.vehicle?.registration_number?.toLowerCase().includes(q) ||
      String(log.liters).includes(q) ||
      String(log.cost).includes(q)
    );
  });

  return (
    <div className="space-y-6">
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

      {/* Header & Log Fuel Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Fuel className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              Fuel Logs
              {isPending && (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
            </h1>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Track fuel purchases per vehicle. Link to trips for accurate
            efficiency reporting.
          </p>
        </div>

        <Button
          onClick={() => setIsLogOpen(true)}
          className="shrink-0 font-semibold shadow-sm cursor-pointer"
          disabled={isPending}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Log Fuel
        </Button>
      </div>

      {/* Search Filter */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search vehicle, liters, cost..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Fuel Logs Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead className="hidden md:table-cell">Trip</TableHead>
              <TableHead>Liters</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                >
                  <Fuel className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No fuel logs found</p>
                  <p className="text-xs mt-1">
                    Click &quot;Log Fuel&quot; to record a fuel purchase.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="cursor-pointer">
                  <TableCell>
                    <div>
                      <p className="font-semibold text-sm">
                        {log.vehicle?.name ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.vehicle?.registration_number ?? ""}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {log.trip_id ? log.trip_id.slice(0, 8).toUpperCase() : "—"}
                  </TableCell>
                  <TableCell className="font-mono font-semibold text-sm">
                    {Number(log.liters).toFixed(2)} L
                  </TableCell>
                  <TableCell className="font-semibold text-sm">
                    {formatCurrency(Number(log.cost))}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(log.log_date)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Log Fuel Dialog */}
      <FuelLogForm
        open={isLogOpen}
        onOpenChange={setIsLogOpen}
        vehicles={initialVehicles}
        trips={initialTrips}
        onSubmit={handleLogFuel}
      />
    </div>
  );
}
