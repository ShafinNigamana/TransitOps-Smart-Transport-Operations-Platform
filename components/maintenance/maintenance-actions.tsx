"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaintenanceRecord } from "@/types/database";

interface MaintenanceActionsProps {
  record: MaintenanceRecord;
  userRole?: string;
  onCloseRepair: (id: string) => void;
}

export function MaintenanceActions({
  record,
  userRole = "driver",
  onCloseRepair,
}: MaintenanceActionsProps) {
  const canClose = userRole === "fleet_manager";

  if (record.status === "open") {
    if (!canClose) {
      return <span className="text-xs text-muted-foreground">—</span>;
    }
    return (
      <Button
        size="sm"
        variant="success"
        onClick={() => onCloseRepair(record.id)}
        className="font-medium"
      >
        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
        Close Repair
      </Button>
    );
  }

  return (
    <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
      Completed
    </span>
  );
}
