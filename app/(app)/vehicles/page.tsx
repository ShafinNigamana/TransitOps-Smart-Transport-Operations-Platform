import { Suspense } from "react";
import { VehicleTable } from "@/components/vehicles/vehicle-table";
import { TableSkeleton } from "@/components/shared/loading-skeletons";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { Vehicle } from "@/types/database";

export const metadata: Metadata = {
  title: "Vehicle Registry — TransitOps",
  description: "Manage your fleet vehicles, track status, and register new vehicles.",
};

export const revalidate = 0; // Live data updates

async function VehiclesContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userRole = user?.user_metadata?.role || "driver";

  const { data } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });

  const vehicles = (data ?? []) as Vehicle[];

  return <VehicleTable initialVehicles={vehicles} userRole={userRole} />;
}

export default function VehiclesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<TableSkeleton />}>
        <VehiclesContent />
      </Suspense>
    </div>
  );
}
