"use client";

import * as React from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Wrench } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { MaintenanceActions } from "@/components/maintenance/maintenance-actions";
import { MaintenanceRecord } from "@/types/database";
import { formatCurrency, formatDate } from "@/lib/utils";

interface MaintenanceTableProps {
  records: MaintenanceRecord[];
  onCloseRepair: (id: string) => void;
}

export function MaintenanceTable({
  records,
  onCloseRepair,
}: MaintenanceTableProps) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title="No maintenance records found"
        description="No repair or service records match the current view."
      />
    );
  }

  return (
    <div>
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Vehicle</TableHead>
              <TableHead className="w-[220px]">Maintenance Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                      {record.vehicle?.name || "Assigned Vehicle"}
                    </span>
                    <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                      {record.vehicle?.registration_number || record.vehicle_id}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                    {record.maintenance_type}
                  </span>
                </TableCell>

                <TableCell>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 max-w-md">
                    {record.description}
                  </p>
                  <span className="text-[11px] text-neutral-400 block mt-1">
                    Opened: {formatDate(record.opened_at)}
                    {record.closed_at
                      ? ` • Closed: ${formatDate(record.closed_at)}`
                      : ""}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(record.cost)}
                  </span>
                </TableCell>

                <TableCell>
                  <StatusBadge status={record.status} />
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <MaintenanceActions
                      record={record}
                      onCloseRepair={onCloseRepair}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View Fallback */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {records.map((record) => (
          <div
            key={record.id}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 block">
                  {record.vehicle?.name || "Assigned Vehicle"}
                </span>
                <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  {record.vehicle?.registration_number || record.vehicle_id}
                </span>
              </div>
              <StatusBadge status={record.status} />
            </div>

            <div>
              <div className="font-medium text-sm text-neutral-800 dark:text-neutral-200">
                {record.maintenance_type}
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                {record.description}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800/60 p-2.5">
              <span className="text-neutral-500 dark:text-neutral-400">
                Cost
              </span>
              <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                {formatCurrency(record.cost)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-xs text-neutral-400">
                Opened {formatDate(record.opened_at)}
              </span>
              <MaintenanceActions
                record={record}
                onCloseRepair={onCloseRepair}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
