import React from "react";
import { Metadata } from "next";
import { TripsView } from "@/components/trips/trips-view";
import { createClient } from "@/lib/supabase/server";
import type { Trip, Vehicle, Driver } from "@/types/database";

export const metadata: Metadata = {
  title: "Trips | TransitOps",
  description:
    "Manage fleet trips, dispatch routes, and monitor live deliveries.",
};

export const revalidate = 0; // Disable static cache for live telemetry dashboard

export default async function TripsPage() {
  const supabase = await createClient();

  // Fetch initial dataset
  const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
    supabase
      .from("trips")
      .select("*, vehicle:vehicles(*), driver:drivers(*)")
      .order("created_at", { ascending: false }),
    supabase.from("vehicles").select("*").order("name"),
    supabase.from("drivers").select("*").order("full_name"),
  ]);

  const trips = (tripsRes.data ?? []) as Trip[];
  const vehicles = (vehiclesRes.data ?? []) as Vehicle[];
  const drivers = (driversRes.data ?? []) as Driver[];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <TripsView
        initialTrips={trips}
        initialVehicles={vehicles}
        initialDrivers={drivers}
      />
    </div>
  );
}
