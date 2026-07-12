import { VehicleTable } from "@/components/vehicles/vehicle-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vehicle Registry — TransitOps",
  description: "Manage your fleet vehicles, track status, and register new vehicles.",
};

export default function VehiclesPage() {
  return <VehicleTable />;
}
