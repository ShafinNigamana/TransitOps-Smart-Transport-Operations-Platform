"use client";

import * as React from "react";
import { CheckCircle2, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Trip } from "@/types/database";

interface TripActionsProps {
  trip: Trip;
  userRole?: string;
  onDispatch: (tripId: string) => void;
  onOpenCompleteDialog: (trip: Trip) => void;
  onCancel: (tripId: string) => void;
}

export function TripActions({
  trip,
  userRole = "driver",
  onDispatch,
  onOpenCompleteDialog,
  onCancel,
}: TripActionsProps) {
  if (trip.status === "draft") {
    const showDispatch = userRole === "driver" || userRole === "fleet_manager";
    const showCancel = userRole === "driver" || userRole === "fleet_manager";
    if (!showDispatch && !showCancel) {
      return <span className="text-xs text-muted-foreground">—</span>;
    }
    return (
      <div className="flex items-center gap-2">
        {showDispatch && (
          <Button
            size="sm"
            variant="default"
            onClick={() => onDispatch(trip.id)}
          >
            <Send className="h-3.5 w-3.5 mr-1" />
            Dispatch
          </Button>
        )}
        {showCancel && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onCancel(trip.id)}
            className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
        )}
      </div>
    );
  }

  if (trip.status === "dispatched") {
    const showComplete = userRole === "driver";
    const showCancel = userRole === "driver" || userRole === "fleet_manager";
    if (!showComplete && !showCancel) {
      return <span className="text-xs text-muted-foreground">—</span>;
    }
    return (
      <div className="flex items-center gap-2">
        {showComplete && (
          <Button
            size="sm"
            variant="success"
            onClick={() => onOpenCompleteDialog(trip)}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Complete
          </Button>
        )}
        {showCancel && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onCancel(trip.id)}
            className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
        )}
      </div>
    );
  }

  // Completed or Cancelled terminal state
  return (
    <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
      Finalized
    </span>
  );
}
