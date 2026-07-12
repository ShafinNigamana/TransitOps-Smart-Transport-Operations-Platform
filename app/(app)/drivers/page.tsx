import { Suspense } from "react";
import { DriverTable } from "@/components/drivers/driver-table";
import { TableSkeleton } from "@/components/shared/loading-skeletons";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { Driver } from "@/types/database";

export const metadata: Metadata = {
  title: "Driver Management — TransitOps",
  description: "Manage fleet drivers, safety scores, and licensing compliance.",
};

export const revalidate = 0; // Live data updates

async function DriversContent() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("drivers")
    .select("*")
    .order("created_at", { ascending: false });

  const drivers = (data ?? []) as Driver[];

  return <DriverTable initialDrivers={drivers} />;
}

export default function DriversPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<TableSkeleton />}>
        <DriversContent />
      </Suspense>
    </div>
  );
}
