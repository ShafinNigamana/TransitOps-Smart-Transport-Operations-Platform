import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function KPISkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between p-6 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {/* Header area */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-40 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 flex-1" />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-0"
          >
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton
                key={j}
                className="h-4 flex-1"
                style={{ opacity: 1 - i * 0.08 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-52 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>
      {/* KPI summary row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-xl border border-border bg-card"
          >
            <Skeleton className="h-3.5 w-24 mb-3" />
            <Skeleton className="h-7 w-20 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      {/* Chart area */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <Skeleton className="h-5 w-36 mb-4" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <Skeleton className="h-5 w-36 mb-4" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <Skeleton className="h-5 w-40" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-6 py-3.5 border-b border-border last:border-0"
          >
            {Array.from({ length: 6 }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
