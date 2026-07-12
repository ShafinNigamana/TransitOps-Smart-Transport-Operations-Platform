import { VehicleTable } from "@/components/vehicles/vehicle-table";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { Vehicle } from "@/types/database";

export const metadata: Metadata = {
  title: "Vehicle Registry — TransitOps",
  description: "Manage your fleet vehicles, track status, and register new vehicles.",
};

export const revalidate = 0; // Live data updates

export default async function VehiclesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });

  const vehicles = (data ?? []) as Vehicle[];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <VehicleTable initialVehicles={vehicles} />
    </div>
  );
}
