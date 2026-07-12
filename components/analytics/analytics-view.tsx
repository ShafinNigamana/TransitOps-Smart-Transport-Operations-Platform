"use client";

import * as React from "react";
import {
  BarChart3,
  Download,
  Fuel,
  DollarSign,
  TrendingUp,
  Activity,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/shared/kpi-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { exportFleetCSV } from "@/lib/actions/analytics";
import type { FleetAnalyticsSummary } from "@/lib/actions/analytics";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface AnalyticsViewProps {
  data: FleetAnalyticsSummary;
}

const CHART_COLORS = [
  "#2C7A7B", // freight teal (secondary accent)
  "#D97A2B", // route amber (primary accent)
  "#3D8B7A", // desaturated sage
  "#C4853A", // desaturated ochre
  "#5B5E64", // muted steel
  "#DC4441", // operations red
];

export function AnalyticsView({ data }: AnalyticsViewProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await exportFleetCSV();
      if (result.success) {
        const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `transitops-fleet-report-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Fleet report CSV exported successfully.");
      } else {
        toast.error(result.error.message || "Failed to export CSV report.");
      }
    } catch (err) {
      toast.error("An unexpected error occurred during CSV export.");
    } finally {
      setIsExporting(false);
    }
  };

  // Prepare chart data
  const costComparisonData = data.operationalCosts
    .filter((v) => v.total_operational_cost > 0)
    .sort((a, b) => b.total_operational_cost - a.total_operational_cost)
    .slice(0, 10)
    .map((v) => ({
      name: v.registration_number,
      maintenance: v.maintenance_cost,
      fuel: v.fuel_cost,
      other: v.other_expenses,
    }));

  const costBreakdownData = [
    { name: "Fuel", value: data.totalFuelCost, color: "#f59e0b" },
    { name: "Maintenance", value: data.totalMaintenanceCost, color: "#3b82f6" },
    { name: "Other", value: data.totalOtherExpenses, color: "#10b981" },
  ].filter((d) => d.value > 0);

  const fuelEfficiencyData = data.fuelEfficiency
    .filter((v) => v.fuel_efficiency !== null)
    .sort((a, b) => (b.fuel_efficiency ?? 0) - (a.fuel_efficiency ?? 0))
    .slice(0, 10)
    .map((v) => ({
      name: v.registration_number,
      efficiency: v.fuel_efficiency,
    }));

  const hasAnyData =
    data.totalOperationalCost > 0 ||
    data.fuelEfficiency.some((v) => v.fuel_efficiency !== null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Fleet Analytics
            </h1>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Financial performance, fuel efficiency, and vehicle ROI — computed
            from live operational data.
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="shrink-0 font-semibold cursor-pointer"
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-1.5" />
          )}
          Export Fleet CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Fleet Utilization"
          value={`${Math.round(data.fleetUtilizationPct)}%`}
          icon={Activity}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/10"
        >
          <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${data.fleetUtilizationPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Active vehicles / total non-retired
          </p>
        </KPICard>

        <KPICard
          title="Total Fuel Cost"
          value={formatCurrency(data.totalFuelCost)}
          icon={Fuel}
          iconColor="text-amber-500"
          iconBg="bg-amber-500/10"
        >
          <p className="text-xs text-muted-foreground">
            Across all fuel log entries
          </p>
        </KPICard>

        <KPICard
          title="Total Operational Cost"
          value={formatCurrency(data.totalOperationalCost)}
          icon={DollarSign}
          iconColor="text-rose-500"
          iconBg="bg-rose-500/10"
        >
          <p className="text-xs text-muted-foreground">
            Fuel + Maintenance + Other
          </p>
        </KPICard>

        <KPICard
          title="Avg Fuel Efficiency"
          value={
            data.avgFuelEfficiency !== null
              ? `${data.avgFuelEfficiency} km/L`
              : "No data"
          }
          icon={TrendingUp}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
        >
          <p className="text-xs text-muted-foreground">
            Distance ÷ fuel consumed (fleet avg)
          </p>
        </KPICard>
      </div>

      {/* Charts Grid */}
      {hasAnyData ? (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Vehicle Cost Comparison Bar Chart */}
          {costComparisonData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-1">
                Vehicle Cost Comparison
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Stacked operational costs per vehicle
              </p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costComparisonData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                    />
                    <Bar
                      dataKey="maintenance"
                      name="Maintenance"
                      stackId="cost"
                      fill="#3b82f6"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="fuel"
                      name="Fuel"
                      stackId="cost"
                      fill="#f59e0b"
                    />
                    <Bar
                      dataKey="other"
                      name="Other"
                      stackId="cost"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Cost Breakdown Pie Chart */}
          {costBreakdownData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-1">
                Fleet Cost Breakdown
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Proportional split of total operational costs
              </p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {costBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Fuel Efficiency Bar Chart */}
          {fuelEfficiencyData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
              <h3 className="text-base font-bold text-foreground mb-1">
                Fuel Efficiency by Vehicle
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Kilometers per liter — higher is better
              </p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fuelEfficiencyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "km/L",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: "11px", fill: "hsl(var(--muted-foreground))" },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value) => `${value} km/L`}
                    />
                    <Bar dataKey="efficiency" name="Fuel Efficiency" radius={[6, 6, 0, 0]}>
                      {fuelEfficiencyData.map((_, index) => (
                        <Cell
                          key={`bar-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="font-semibold text-foreground">No analytics data yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Complete trips, log fuel, and record expenses to see charts and insights.
          </p>
        </div>
      )}

      {/* Vehicle ROI Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-6 pb-4 border-b border-border">
          <h3 className="text-base font-bold text-foreground">
            Vehicle ROI Analysis
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Return on investment per vehicle: [Revenue − (Maintenance + Fuel)] ÷
            Acquisition Cost
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead className="hidden md:table-cell">
                Acquisition
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                Maintenance
              </TableHead>
              <TableHead className="hidden lg:table-cell">Fuel</TableHead>
              <TableHead>Op. Cost</TableHead>
              <TableHead>ROI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.vehicleROI.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  No vehicles found
                </TableCell>
              </TableRow>
            ) : (
              data.vehicleROI.map((v) => (
                <TableRow key={v.vehicle_id} className="cursor-pointer">
                  <TableCell>
                    <div>
                      <p className="font-semibold text-sm">
                        {v.vehicle_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {v.registration_number}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-sm">
                    {formatCurrency(v.acquisition_cost)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-mono text-sm text-muted-foreground">
                    {formatCurrency(v.maintenance_cost)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-mono text-sm text-muted-foreground">
                    {formatCurrency(v.fuel_cost)}
                  </TableCell>
                  <TableCell className="font-mono font-semibold text-sm">
                    {formatCurrency(v.total_operational_cost)}
                  </TableCell>
                  <TableCell className="font-mono">
                    {v.roi !== null ? (
                      <Badge
                        variant={v.roi >= 0 ? "success" : "danger"}
                      >
                        {(v.roi * 100).toFixed(2)}%
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        N/A
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
