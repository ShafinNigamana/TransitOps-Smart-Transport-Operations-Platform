import { DriverTable } from "@/components/drivers/driver-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Driver Management — TransitOps",
  description: "Manage driver roster, track license compliance, and register new drivers.",
};

export default function DriversPage() {
  return <DriverTable />;
}
