"use client";

import * as React from "react";
import { Plus, Search, Truck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { TripTable } from "@/components/trips/trip-columns";
import { TripForm } from "@/components/trips/trip-form";
import { TripCompleteDialog } from "@/components/trips/trip-complete-dialog";
import {
  CreateTripInput,
  Trip,
  TripStatus,
  Vehicle,
  Driver,
} from "@/types/database";
import {
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
} from "@/lib/actions/trips";

import { toast } from "sonner";

interface TripsViewProps {
  initialTrips: Trip[];
  initialVehicles: Vehicle[];
  initialDrivers: Driver[];
}

export function TripsView({
  initialTrips,
  initialVehicles,
  initialDrivers,
}: TripsViewProps) {
  const [trips, setTrips] = React.useState<Trip[]>(initialTrips);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>(initialVehicles);
  const [drivers, setDrivers] = React.useState<Driver[]>(initialDrivers);

  const [activeTab, setActiveTab] = React.useState<TripStatus>("draft");
  const [searchQuery, setSearchQuery] = React.useState("");

  const [isNewTripOpen, setIsNewTripOpen] = React.useState(false);
  const [selectedTripForComplete, setSelectedTripForComplete] =
    React.useState<Trip | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  // Keep state synchronized with server props updates
  React.useEffect(() => {
    setTrips(initialTrips);
  }, [initialTrips]);

  React.useEffect(() => {
    setVehicles(initialVehicles);
  }, [initialVehicles]);

  React.useEffect(() => {
    setDrivers(initialDrivers);
  }, [initialDrivers]);

  // Handlers using server actions and transitions
  const handleCreateTrip = (input: CreateTripInput) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await createTrip(input);
      if (res.success) {
        toast.success("Trip created as draft successfully.");
        setIsNewTripOpen(false);
      } else {
        toast.error(res.error.message);
        setErrorMessage(res.error.message);
      }
    });
  };

  const handleDispatchTrip = (tripId: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await dispatchTrip(tripId);
      if (res.success) {
        toast.success("Trip dispatched successfully!");
      } else {
        toast.error(res.error.message);
        setErrorMessage(res.error.message);
      }
    });
  };

  const handleCompleteTrip = (
    actualDistanceKm: number,
    fuelConsumedL: number
  ) => {
    if (!selectedTripForComplete) return;
    const tripId = selectedTripForComplete.id;

    setErrorMessage(null);
    startTransition(async () => {
      const res = await completeTrip({
        trip_id: tripId,
        actual_distance_km: actualDistanceKm,
        fuel_consumed_l: fuelConsumedL,
      });
      if (res.success) {
        toast.success("Trip marked as completed!");
        setSelectedTripForComplete(null);
      } else {
        toast.error(res.error.message);
        setErrorMessage(res.error.message);
      }
    });
  };

  const handleCancelTrip = (tripId: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await cancelTrip(tripId);
      if (res.success) {
        toast.success("Trip cancelled successfully.");
      } else {
        toast.error(res.error.message);
        setErrorMessage(res.error.message);
      }
    });
  };

  // Filter trips by active status tab and search query
  const getFilteredTrips = (status: TripStatus) => {
    return trips
      .filter((t) => t.status === status)
      .filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          t.source.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q) ||
          t.vehicle?.name.toLowerCase().includes(q) ||
          t.vehicle?.registration_number.toLowerCase().includes(q) ||
          t.driver?.full_name.toLowerCase().includes(q) ||
          (t.trip_code && t.trip_code.toLowerCase().includes(q))
        );
      });
  };

  const counts: Record<TripStatus, number> = {
    draft: trips.filter((t) => t.status === "draft").length,
    dispatched: trips.filter((t) => t.status === "dispatched").length,
    completed: trips.filter((t) => t.status === "completed").length,
    cancelled: trips.filter((t) => t.status === "cancelled").length,
  };

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

      {/* Header & New Trip Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-fleet-amber/10 flex items-center justify-center text-fleet-amber">
              <Truck className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              Trip Management
              {isPending && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            </h1>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Create, dispatch, and track active logistics routes and deliveries
            in real time.
          </p>
        </div>

        <Button
          onClick={() => setIsNewTripOpen(true)}
          className="shrink-0 font-semibold shadow-sm cursor-pointer"
          disabled={isPending}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Trip
        </Button>
      </div>

      {/* Tabs & Search Filter */}
      <Tabs
        defaultValue="draft"
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as TripStatus)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="draft" count={counts.draft}>
              Draft
            </TabsTrigger>
            <TabsTrigger value="dispatched" count={counts.dispatched}>
              Dispatched
            </TabsTrigger>
            <TabsTrigger value="completed" count={counts.completed}>
              Completed
            </TabsTrigger>
            <TabsTrigger value="cancelled" count={counts.cancelled}>
              Cancelled
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search route, vehicle, driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value="draft" className="mt-4">
          <TripTable
            trips={getFilteredTrips("draft")}
            onDispatch={handleDispatchTrip}
            onOpenCompleteDialog={setSelectedTripForComplete}
            onCancel={handleCancelTrip}
          />
        </TabsContent>

        <TabsContent value="dispatched" className="mt-4">
          <TripTable
            trips={getFilteredTrips("dispatched")}
            onDispatch={handleDispatchTrip}
            onOpenCompleteDialog={setSelectedTripForComplete}
            onCancel={handleCancelTrip}
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <TripTable
            trips={getFilteredTrips("completed")}
            onDispatch={handleDispatchTrip}
            onOpenCompleteDialog={setSelectedTripForComplete}
            onCancel={handleCancelTrip}
          />
        </TabsContent>

        <TabsContent value="cancelled" className="mt-4">
          <TripTable
            trips={getFilteredTrips("cancelled")}
            onDispatch={handleDispatchTrip}
            onOpenCompleteDialog={setSelectedTripForComplete}
            onCancel={handleCancelTrip}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TripForm
        open={isNewTripOpen}
        onOpenChange={setIsNewTripOpen}
        vehicles={vehicles.filter((v) => v.status === "available")} // Only show available vehicles in form
        drivers={drivers.filter((d) => d.status === "available")} // Only show available drivers in form
        onSubmit={handleCreateTrip}
      />

      <TripCompleteDialog
        open={!!selectedTripForComplete}
        onOpenChange={(open) => {
          if (!open) setSelectedTripForComplete(null);
        }}
        trip={selectedTripForComplete}
        onSubmit={handleCompleteTrip}
      />
    </div>
  );
}
