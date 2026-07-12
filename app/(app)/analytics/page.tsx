import React, { Suspense } from "react";
import { Metadata } from "next";
import { AnalyticsView } from "@/components/analytics/analytics-view";
import {
  getFleetAnalyticsSummary,
  type FleetAnalyticsSummary,
} from "@/lib/actions/analytics";
import { EmptyState } from "@/components/shared/empty-state";
import { ChartSkeleton } from "@/components/shared/loading-skeletons";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Analytics | TransitOps",
  description:
    "Fleet analytics dashboard — fuel efficiency, operational costs, vehicle ROI, and utilization metrics.",
};

export const revalidate = 0;

async function AnalyticsContent() {
  const result = await getFleetAnalyticsSummary();

  // Use live data only — no mock fallback
  if (!result.success || result.data.operationalCosts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12">
        <EmptyState
          icon={BarChart3}
          title="No analytics data yet"
          description="Start logging trips, fuel purchases, and expenses to see fleet efficiency, operational costs, and ROI computed in real time."
        />
      </div>
    );
  }

  return <AnalyticsView data={result.data} />;
}

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<ChartSkeleton />}>
        <AnalyticsContent />
      </Suspense>
    </div>
  );
}
