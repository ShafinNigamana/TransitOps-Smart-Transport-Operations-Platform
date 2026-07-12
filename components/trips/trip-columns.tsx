"use client";

import * as React from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ArrowRight, MapPin, Truck, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { TripActions } from "@/components/trips/trip-actions";
import { Trip } from "@/types/database";
import { formatDate } from "@/lib/utils";

interface TripTableProps {
  trips: Trip[];
  userRole?: string;
  onDispatch: (tripId: string) => void;
  onOpenCompleteDialog: (trip: Trip) => void;
  onCancel: (tripId: string) => void;
}

export function TripTable({
  trips,
  userRole = "driver",
  onDispatch,
  onOpenCompleteDialog,
  onCancel,
}: TripTableProps) {
  if (trips.length === 0) {
    return (
      <EmptyState
        icon={Truck}
        title="No trips found"
        description="There are no trips matching the selected status tab."
      />
    );
  }

  return (
    <div>
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Route</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Cargo Weight</TableHead>
              <TableHead>Distance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map((trip) => (
              <TableRow key={trip.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <span>{trip.source}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                      <span>{trip.destination}</span>
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {trip.trip_code || trip.id} • Created{" "}
                      {formatDate(trip.created_at)}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-fleet-amber/10 flex items-center justify-center text-fleet-amber">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {trip.vehicle?.name || "Assigned Vehicle"}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                        {trip.vehicle?.registration_number || trip.vehicle_id}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {trip.driver?.full_name || "Assigned Driver"}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {trip.driver?.license_category || "Driver"}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="font-medium text-sm">
                    {trip.cargo_weight_kg.toLocaleString()} kg
                  </span>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      Planned: {trip.planned_distance_km} km
                    </span>
                    {trip.actual_distance_km !== undefined && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Actual: {trip.actual_distance_km} km (
                        {trip.fuel_consumed_l}L fuel)
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <StatusBadge status={trip.status} />
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <TripActions
                      trip={trip}
                      userRole={userRole}
                      onDispatch={onDispatch}
                      onOpenCompleteDialog={onOpenCompleteDialog}
                      onCancel={onCancel}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View Fallback */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500">
                  {trip.trip_code || trip.id}
                </span>
                <div className="flex items-center gap-1.5 font-semibold text-sm text-neutral-900 dark:text-neutral-100 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-fleet-amber shrink-0" />
                  <span>{trip.source}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
                  <span>{trip.destination}</span>
                </div>
              </div>
              <StatusBadge status={trip.status} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs rounded-xl bg-secondary/30 p-2.5">
              <div>
                <span className="text-neutral-500 dark:text-neutral-400 block">
                  Vehicle
                </span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {trip.vehicle?.name} ({trip.vehicle?.registration_number})
                </span>
              </div>
              <div>
                <span className="text-neutral-500 dark:text-neutral-400 block">
                  Driver
                </span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {trip.driver?.full_name}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 dark:text-neutral-400 block">
                  Cargo
                </span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {trip.cargo_weight_kg.toLocaleString()} kg
                </span>
              </div>
              <div>
                <span className="text-neutral-500 dark:text-neutral-400 block">
                  Distance
                </span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {trip.planned_distance_km} km
                  {trip.actual_distance_km !== undefined
                    ? ` (${trip.actual_distance_km} actual)`
                    : ""}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border">
              <span className="text-xs text-neutral-400">
                Created {formatDate(trip.created_at)}
              </span>
              <TripActions
                trip={trip}
                userRole={userRole}
                onDispatch={onDispatch}
                onOpenCompleteDialog={onOpenCompleteDialog}
                onCancel={onCancel}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
