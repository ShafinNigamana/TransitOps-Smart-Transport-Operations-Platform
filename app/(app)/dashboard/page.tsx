import {
  TrendingUp,
  AlertTriangle,
  ArrowRightLeft,
  Truck,
  Users,
  Clock,
  ExternalLink,
  ArrowRight,
  Activity,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { getFleetKPIs, getRecentTrips } from "@/lib/actions/analytics";
import { StatusBadge } from "@/components/shared/status-badge";
import { KPICard } from "@/components/shared/kpi-card";
import type { FleetKPIs, TripStatus } from "@/types/database";

// Fallback mock data when Supabase tables are empty or not yet seeded
const MOCK_KPIS: FleetKPIs = {
  totalVehicles: 48,
  activeVehicles: 34,
  availableVehicles: 8,
  vehiclesInMaintenance: 6,
  retiredVehicles: 4,
  activeTrips: 34,
  pendingTrips: 5,
  driversOnDuty: 18,
  totalDrivers: 22,
  fleetUtilizationPct: 77.27,
};

interface MockTrip {
  id: string;
  source: string;
  destination: string;
  vehicleName: string;
  driverName: string;
  status: TripStatus;
  time: string;
}

const MOCK_TRIPS: MockTrip[] = [
  {
    id: "TRIP-302",
    source: "Chicago, IL",
    destination: "Detroit, MI",
    vehicleName: "Van-05",
    driverName: "Alex",
    status: "dispatched",
    time: "2 mins ago",
  },
  {
    id: "TRIP-301",
    source: "Houston, TX",
    destination: "Austin, TX",
    vehicleName: "Truck-12",
    driverName: "Marcus Vance",
    status: "completed",
    time: "45 mins ago",
  },
  {
    id: "TRIP-300",
    source: "Los Angeles, CA",
    destination: "Phoenix, AZ",
    vehicleName: "Semi-08",
    driverName: "Sarah Chen",
    status: "dispatched",
    time: "1 hour ago",
  },
  {
    id: "TRIP-299",
    source: "Seattle, WA",
    destination: "Portland, OR",
    vehicleName: "Van-02",
    driverName: "David K.",
    status: "cancelled",
    time: "3 hours ago",
  },
  {
    id: "TRIP-298",
    source: "New York, NY",
    destination: "Boston, MA",
    vehicleName: "Truck-04",
    driverName: "Elena Rostova",
    status: "completed",
    time: "5 hours ago",
  },
];

function timeAgo(dateString: string | null): string {
  if (!dateString) return "—";
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function DashboardPage() {
  // Fetch live data from Supabase; fall back to mock if empty/error
  const kpiResult = await getFleetKPIs();
  const kpi: FleetKPIs =
    kpiResult.success && kpiResult.data.totalVehicles > 0
      ? kpiResult.data
      : MOCK_KPIS;

  const tripsResult = await getRecentTrips();
  const hasLiveTrips = tripsResult.success && tripsResult.data.length > 0;

  const nonRetired = kpi.totalVehicles - kpi.retiredVehicles;

  // Build a unified trip feed from live or mock data
  type FeedRow = {
    id: string;
    source: string;
    destination: string;
    vehicleName: string;
    driverName: string;
    status: TripStatus;
    time: string;
  };

  let tripFeed: FeedRow[];
  if (hasLiveTrips) {
    tripFeed = tripsResult.data.map((t) => ({
      id: t.id.slice(0, 8).toUpperCase(),
      source: t.source,
      destination: t.destination,
      vehicleName: t.vehicle?.name ?? t.vehicle?.registration_number ?? "—",
      driverName: t.driver?.full_name ?? "—",
      status: t.status as TripStatus,
      time: timeAgo(t.dispatched_at ?? t.completed_at ?? t.cancelled_at ?? t.created_at),
    }));
  } else {
    tripFeed = MOCK_TRIPS;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <span>
            {hasLiveTrips ? "Live" : "Demo data"} — Last sync: Just now
          </span>
        </div>
      </div>

      {/* KPI Grid — 4 columns on wide screens */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Fleet Utilization */}
        <div className="flex flex-col justify-between p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">
              Fleet Utilization
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-center gap-5 mt-4">
            <div className="relative flex items-center justify-center h-[76px] w-[76px] shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="fill-none"
                  stroke="currentColor"
                  strokeWidth="7"
                  opacity={0.08}
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-emerald-500 fill-none"
                  strokeWidth="7"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - kpi.fleetUtilizationPct / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-lg font-bold text-foreground">
                {Math.round(kpi.fleetUtilizationPct)}%
              </span>
            </div>
            <div>
              <span className="text-2xl font-extrabold text-foreground">
                {kpi.activeVehicles}
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                / {nonRetired}
              </span>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Vehicles currently on active trips.
              </p>
            </div>
          </div>
        </div>

        {/* Active Trips */}
        <KPICard
          title="Active Trips"
          value={kpi.activeTrips}
          icon={ArrowRightLeft}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
        >
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge status="dispatched" />
            <span className="inline-flex items-center rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {kpi.pendingTrips} Pending
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Dispatched trips awaiting completion or cancellation.
          </p>
        </KPICard>

        {/* Vehicles in Shop */}
        <KPICard
          title="Vehicles in Shop"
          value={kpi.vehiclesInMaintenance}
          subtitle="grounded"
          icon={AlertTriangle}
          iconColor="text-amber-500"
          iconBg="bg-amber-500/10"
        >
          <StatusBadge status="in_shop" />
          <p className="text-xs text-muted-foreground mt-2">
            Requires maintenance closure to restore to fleet.
          </p>
        </KPICard>

        {/* Drivers on Duty */}
        <KPICard
          title="Drivers on Duty"
          value={kpi.driversOnDuty}
          subtitle={`/ ${kpi.totalDrivers}`}
          icon={Users}
          iconColor="text-violet-500"
          iconBg="bg-violet-500/10"
        >
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge status="on_trip" />
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
              {kpi.totalDrivers - kpi.driversOnDuty} Available
            </span>
          </div>
        </KPICard>
      </div>

      {/* Bottom Section: Trip Feed + Fleet Health */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Realtime Trip Status Feed */}
        <div className="lg:col-span-2 flex flex-col rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Realtime Trip Status
              </h3>
              <p className="text-xs text-muted-foreground">
                Live dispatch actions and arrival clearances.
              </p>
            </div>
            <Link
              href="/trips"
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 font-semibold cursor-pointer transition-colors duration-150"
            >
              <span>View all</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-semibold text-muted-foreground border-b border-border">
                  <th className="py-3 px-6">Trip</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4 hidden md:table-cell">Assignee</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {tripFeed.map((trip) => (
                  <tr
                    key={trip.id}
                    className="hover:bg-secondary/30 transition-colors duration-150 cursor-pointer"
                  >
                    <td className="py-3.5 px-6 font-mono font-medium text-foreground text-xs">
                      {trip.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-foreground font-medium">
                        <span className="truncate max-w-[100px]">{trip.source}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[100px]">{trip.destination}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium text-xs">
                          {trip.vehicleName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {trip.driverName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={trip.status} />
                    </td>
                    <td className="py-3.5 px-6 text-right text-xs text-muted-foreground whitespace-nowrap">
                      {trip.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fleet Health Panel */}
        <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm">
          <h3 className="text-base font-bold text-foreground p-6 pb-4 border-b border-border">
            Fleet Health Profile
          </h3>

          <div className="p-6 space-y-5">
            {/* Progress: Vehicles On Duty */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <Activity className="h-3 w-3" />
                  Vehicles On Duty
                </span>
                <span className="text-foreground font-bold tabular-nums">
                  {kpi.activeVehicles} / {nonRetired}
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${nonRetired > 0 ? (kpi.activeVehicles / nonRetired) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Progress: Maintenance Backlog */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" />
                  Maintenance Backlog
                </span>
                <span className="text-foreground font-bold tabular-nums">
                  {kpi.vehiclesInMaintenance} / {kpi.totalVehicles}
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${kpi.totalVehicles > 0 ? (kpi.vehiclesInMaintenance / kpi.totalVehicles) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Progress: Driver Capacity */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3" />
                  Available Drivers
                </span>
                <span className="text-foreground font-bold tabular-nums">
                  {kpi.totalDrivers - kpi.driversOnDuty} / {kpi.totalDrivers}
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${kpi.totalDrivers > 0 ? ((kpi.totalDrivers - kpi.driversOnDuty) / kpi.totalDrivers) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Alert Box */}
            <div className="mt-2 p-4 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-start gap-2.5">
                <Truck className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-foreground block">
                    Fleet Status
                  </span>
                  <span className="text-muted-foreground leading-relaxed">
                    {kpi.availableVehicles} vehicles ready for dispatch.{" "}
                    {kpi.vehiclesInMaintenance > 0
                      ? `${kpi.vehiclesInMaintenance} in maintenance.`
                      : "No vehicles in maintenance."}{" "}
                    {kpi.retiredVehicles > 0
                      ? `${kpi.retiredVehicles} retired.`
                      : ""}
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
