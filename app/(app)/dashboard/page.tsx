"use client";

import * as React from "react";
import {
  TrendingUp,
  AlertTriangle,
  ArrowRightLeft,
  Truck,
  Users,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";

interface TripFeedItem {
  id: string;
  route: { from: string; to: string };
  vehicle: string;
  driver: string;
  status: "draft" | "dispatched" | "completed" | "cancelled";
  time: string;
}

const recentTrips: TripFeedItem[] = [
  {
    id: "TRIP-302",
    route: { from: "Chicago, IL", to: "Detroit, MI" },
    vehicle: "Van-05",
    driver: "Alex",
    status: "dispatched",
    time: "2 mins ago",
  },
  {
    id: "TRIP-301",
    route: { from: "Houston, TX", to: "Austin, TX" },
    vehicle: "Truck-12",
    driver: "Marcus Vance",
    status: "completed",
    time: "45 mins ago",
  },
  {
    id: "TRIP-300",
    route: { from: "Los Angeles, CA", to: "Phoenix, AZ" },
    vehicle: "Semi-08",
    driver: "Sarah Chen",
    status: "dispatched",
    time: "1 hour ago",
  },
  {
    id: "TRIP-299",
    route: { from: "Seattle, WA", to: "Portland, OR" },
    vehicle: "Van-02",
    driver: "David K.",
    status: "cancelled",
    time: "3 hours ago",
  },
  {
    id: "TRIP-298",
    route: { from: "New York, NY", to: "Boston, MA" },
    vehicle: "Truck-04",
    driver: "Elena Rostova",
    status: "completed",
    time: "5 hours ago",
  },
];

export default function DashboardPage() {
  // Mock metrics mirroring typical TransitOps fleet settings
  const totalVehicles = 48;
  const activeVehicles = 34;
  const inShopVehicles = 6;
  const retiredVehicles = 4;
  const nonRetiredVehicles = totalVehicles - retiredVehicles;

  const fleetUtilization = Math.round((activeVehicles / nonRetiredVehicles) * 100);

  return (
    <div className="space-y-6">
      {/* Dashboard Section Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Operational Cockpit
          </h2>
          <p className="text-sm text-muted-foreground">
            Realtime fleet telemetry, dispatch utilization, and maintenance status.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/40 px-3 py-1.5 rounded-md border border-border">
          <Clock className="h-3.5 w-3.5" />
          <span>Last sync: Just now</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {/* Fleet Utilization Card */}
        <div className="flex flex-col justify-between p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">
              Fleet Utilization
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>

          <div className="flex items-center gap-6 mt-4">
            <div className="relative flex items-center justify-center h-20 w-20 shrink-0">
              {/* Radial Progress Ring */}
              <svg className="h-full w-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-muted/10 fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-emerald-500 fill-none"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - fleetUtilization / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-lg font-bold text-foreground">
                {fleetUtilization}%
              </span>
            </div>
            <div>
              <span className="text-3xl font-extrabold text-foreground">
                {activeVehicles}
              </span>
              <span className="text-sm text-muted-foreground ml-1">
                / {nonRetiredVehicles} Active
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Percentage of operational vehicles dispatched.
              </p>
            </div>
          </div>
        </div>

        {/* Active Trips Card */}
        <div className="flex flex-col justify-between p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">
              Active Trips
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <ArrowRightLeft className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-4">
            <span className="text-3xl font-extrabold text-foreground">
              {activeVehicles}
            </span>
            <span className="text-sm text-emerald-500 font-semibold ml-2">
              +12% vs yesterday
            </span>
            <div className="mt-3 flex gap-2">
              <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
                28 In Transit
              </span>
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
                6 Dispatched
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Trips currently running or waiting for final odometer clearance.
            </p>
          </div>
        </div>

        {/* Vehicles in Shop Card */}
        <div className="flex flex-col justify-between p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">
              Vehicles in Shop
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-4">
            <span className="text-3xl font-extrabold text-foreground">
              {inShopVehicles}
            </span>
            <span className="text-sm text-muted-foreground ml-1">
              Currently grounded
            </span>
            <div className="mt-3 flex gap-2">
              <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">
                2 Critical
              </span>
              <span className="inline-flex items-center rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                4 Routine
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Requires technician authorization to restore to available.
            </p>
          </div>
        </div>
      </div>

      {/* Main Core Content: Feed and Status Overview */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Recent Trip Status Feed */}
        <div className="lg:col-span-2 flex flex-col p-6 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Realtime Trip Status
              </h3>
              <p className="text-xs text-muted-foreground">
                Live dispatch actions and arrival clearances.
              </p>
            </div>
            <button className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-semibold cursor-pointer">
              <span>View all trips</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          {/* Feed List */}
          <div className="mt-4 divide-y divide-border overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-semibold text-muted-foreground">
                  <th className="pb-3 pr-4">Trip ID</th>
                  <th className="pb-3 px-4">Route</th>
                  <th className="pb-3 px-4">Assignee</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 pl-4 text-right">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {recentTrips.map((trip) => (
                  <tr
                    key={trip.id}
                    className="hover:bg-secondary/20 transition-colors duration-150 group"
                  >
                    <td className="py-3.5 pr-4 font-mono font-medium text-foreground cursor-pointer">
                      {trip.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{trip.route.from}</span>
                        <span className="text-muted-foreground">➔</span>
                        <span>{trip.route.to}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium">
                          {trip.vehicle}
                        </span>
                        <span className="text-xs">{trip.driver}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {trip.status === "dispatched" && (
                        <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-500">
                          Dispatched
                        </span>
                      )}
                      {trip.status === "completed" && (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
                          Completed
                        </span>
                      )}
                      {trip.status === "draft" && (
                        <span className="inline-flex items-center rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          Draft
                        </span>
                      )}
                      {trip.status === "cancelled" && (
                        <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-500">
                          Cancelled
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pl-4 text-right text-xs text-muted-foreground whitespace-nowrap">
                      {trip.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Fleet Health Panel */}
        <div className="flex flex-col p-6 rounded-xl border border-border bg-card shadow-sm">
          <h3 className="text-base font-bold text-foreground pb-4 border-b border-border">
            Fleet Health Profile
          </h3>

          <div className="mt-4 space-y-4">
            {/* Health Meter 1: Vehicle Status */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground font-medium">Vehicles On Duty</span>
                <span className="text-foreground font-bold">{activeVehicles} / {nonRetiredVehicles}</span>
              </div>
              <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(activeVehicles / nonRetiredVehicles) * 100}%` }}
                />
              </div>
            </div>

            {/* Health Meter 2: In Shop Status */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground font-medium">Maintenance Backlog</span>
                <span className="text-foreground font-bold">{inShopVehicles} / {totalVehicles}</span>
              </div>
              <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(inShopVehicles / totalVehicles) * 100}%` }}
                />
              </div>
            </div>

            {/* Health Meter 3: Driver Capacity */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground font-medium">Active Dispatch Staff</span>
                <span className="text-foreground font-bold">18 / 22 available</span>
              </div>
              <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: "81%" }}
                />
              </div>
            </div>

            {/* Operational Alert Box */}
            <div className="mt-6 p-4 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-start gap-2.5">
                <Truck className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-foreground block">Route Warning</span>
                  <span className="text-muted-foreground">
                    Severe weather delay reported on I-94 between Chicago and Detroit. Trips TRIP-302 and TRIP-300 might experience up to 45 mins delay.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
