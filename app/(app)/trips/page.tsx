import React from "react";
import { Metadata } from "next";
import { TripsView } from "@/components/trips/trips-view";

export const metadata: Metadata = {
  title: "Trips | TransitOps",
  description:
    "Manage fleet trips, dispatch routes, and monitor live deliveries.",
};

export default function TripsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <TripsView />
    </div>
  );
}
