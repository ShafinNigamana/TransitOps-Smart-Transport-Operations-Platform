import React, { Suspense } from "react";
import { Metadata } from "next";
import { TripsView } from "@/components/trips/trips-view";
import { TableSkeleton } from "@/components/shared/loading-skeletons";
import { createClient } from "@/lib/supabase/server";
import type { Trip, Vehicle, Driver } from "@/types/database";

export const metadata: Metadata = {
  title: "Trips | TransitOps",
  description:
    "Manage fleet trips, dispatch routes, and monitor live deliveries.",
};

export const revalidate = 0; // Disable static cache for live telemetry dashboard

async function TripsContent() {
  const supabase = await createClient();

  const [tripsRes, vehiclesRes, driversRes, userRes] = await Promise.all([
    supabase
      .from("trips")
      .select("*, vehicle:vehicles(*), driver:drivers(*)")
      .order("created_at", { ascending: false }),
    supabase.from("vehicles").select("*").order("name"),
    supabase.from("drivers").select("*").order("full_name"),
    supabase.auth.getUser(),
  ]);

  const rawTrips = (tripsRes.data ?? []) as Trip[];
  const vehicles = (vehiclesRes.data ?? []) as Vehicle[];
  const drivers = (driversRes.data ?? []) as Driver[];
  const user = userRes.data.user;
  const userRole = user?.user_metadata?.role || "driver";

  let trips = rawTrips;
  if (userRole === "driver" && user) {
    const profileName = user.user_metadata?.full_name || "Driver";
    const matchingDriver = drivers.find(
      (d) =>
        d.full_name.toLowerCase() === profileName.toLowerCase() ||
        d.full_name === "Marcus Brody"
    );
    if (matchingDriver) {
      trips = rawTrips.filter((t) => t.driver_id === matchingDriver.id);
    } else {
      // Fallback to Marcus Brody / Elena Rostova (demo seed drivers)
      trips = rawTrips.filter(
        (t) =>
          t.driver_id === "22222222-2222-2222-2222-222222222222" ||
          t.driver_id === "55555555-5555-5555-5555-555555555555"
      );
    }
  }

  return (
    <TripsView
      initialTrips={trips}
      initialVehicles={vehicles}
      initialDrivers={drivers}
      userRole={userRole}
    />
  );
}

export default function TripsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<TableSkeleton />}>
        <TripsContent />
      </Suspense>
    </div>
  );
}
