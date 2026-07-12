"use client";

import * as React from "react";
import { Plus, Search, Truck } from "lucide-react";
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
} from "@/types/database";
import {
  MOCK_DRIVERS,
  MOCK_TRIPS,
  MOCK_VEHICLES,
} from "@/lib/mock-data";

export function TripsView() {
  const [trips, setTrips] = React.useState<Trip[]>(MOCK_TRIPS);
  const [vehicles, setVehicles] = React.useState(MOCK_VEHICLES);
  const [drivers, setDrivers] = React.useState(MOCK_DRIVERS);

  const [activeTab, setActiveTab] = React.useState<TripStatus>("draft");
  const [searchQuery, setSearchQuery] = React.useState("");

  const [isNewTripOpen, setIsNewTripOpen] = React.useState(false);
  const [selectedTripForComplete, setSelectedTripForComplete] =
    React.useState<Trip | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Handlers
  const handleCreateTrip = (input: CreateTripInput) => {
    const vehicle = vehicles.find((v) => v.id === input.vehicle_id);
    const driver = drivers.find((d) => d.id === input.driver_id);

    const newTrip: Trip = {
      id: `trp-${Date.now()}`,
      trip_code: `TRP-${1000 + trips.length + 1}`,
      source: input.source,
      destination: input.destination,
      cargo_weight_kg: input.cargo_weight_kg,
      planned_distance_km: input.planned_distance_km,
      vehicle_id: input.vehicle_id,
      vehicle,
      driver_id: input.driver_id,
      driver,
      status: "draft",
      created_at: new Date().toISOString(),
    };

    setTrips((prev) => [newTrip, ...prev]);
    setActiveTab("draft");
    setErrorMessage(null);
  };

  const handleDispatchTrip = (tripId: string) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;

    const vehicle = vehicles.find((v) => v.id === trip.vehicle_id);
    const driver = drivers.find((d) => d.id === trip.driver_id);

    if (vehicle && vehicle.status !== "available") {
      setErrorMessage(
        `Cannot dispatch trip: Vehicle ${vehicle.name} is currently '${vehicle.status}'.`
      );
      return;
    }
    if (driver && driver.status !== "available") {
      setErrorMessage(
        `Cannot dispatch trip: Driver ${driver.full_name} is currently '${driver.status}'.`
      );
      return;
    }
    if (driver && new Date(driver.license_expiry_date) < new Date()) {
      setErrorMessage(
        `Cannot dispatch trip: Driver ${driver.full_name}'s license expired on ${driver.license_expiry_date}.`
      );
      return;
    }

    setErrorMessage(null);

    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== tripId) return t;
        return {
          ...t,
          status: "dispatched",
          dispatched_at: new Date().toISOString(),
        };
      })
    );

    // Also update vehicle and driver status to 'on_trip'
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === trip.vehicle_id ? { ...v, status: "on_trip" } : v
      )
    );
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === trip.driver_id ? { ...d, status: "on_trip" } : d
      )
    );
  };

  const handleCompleteTrip = (
    actualDistanceKm: number,
    fuelConsumedL: number
  ) => {
    if (!selectedTripForComplete) return;
    const tripId = selectedTripForComplete.id;

    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== tripId) return t;
        return {
          ...t,
          status: "completed",
          actual_distance_km: actualDistanceKm,
          fuel_consumed_l: fuelConsumedL,
          completed_at: new Date().toISOString(),
        };
      })
    );

    // Free up vehicle and driver
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === selectedTripForComplete.vehicle_id
          ? {
              ...v,
              status: "available",
              odometer_km: v.odometer_km + actualDistanceKm,
            }
          : v
      )
    );
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === selectedTripForComplete.driver_id
          ? { ...d, status: "available" }
          : d
      )
    );

    setSelectedTripForComplete(null);
  };

  const handleCancelTrip = (tripId: string) => {
    const trip = trips.find((t) => t.id === tripId);
    const wasDispatched = trip?.status === "dispatched";

    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== tripId) return t;
        return {
          ...t,
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        };
      })
    );

    if (wasDispatched && trip) {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === trip.vehicle_id ? { ...v, status: "available" } : v
        )
      );
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === trip.driver_id ? { ...d, status: "available" } : d
        )
      );
    }
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
            className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & New Trip Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Truck className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Trip Management
            </h1>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Create, dispatch, and track active logistics routes and deliveries
            in real time.
          </p>
        </div>

        <Button
          onClick={() => setIsNewTripOpen(true)}
          className="shrink-0 font-semibold shadow-sm"
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
        vehicles={vehicles}
        drivers={drivers}
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
