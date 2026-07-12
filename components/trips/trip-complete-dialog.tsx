"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalForm } from "@/components/shared/modal-form";
import { Trip } from "@/types/database";

interface TripCompleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip | null;
  onSubmit: (actualDistanceKm: number, fuelConsumedL: number) => void;
}

export function TripCompleteDialog({
  open,
  onOpenChange,
  trip,
  onSubmit,
}: TripCompleteDialogProps) {
  const [actualDistanceKm, setActualDistanceKm] = React.useState("");
  const [fuelConsumedL, setFuelConsumedL] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open && trip) {
      setActualDistanceKm(String(trip.planned_distance_km || ""));
      setFuelConsumedL("");
      setErrors({});
    }
  }, [open, trip]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!actualDistanceKm || Number(actualDistanceKm) <= 0) {
      newErrors.actualDistanceKm = "Please enter a valid actual distance (> 0 km).";
    }
    if (!fuelConsumedL || Number(fuelConsumedL) <= 0) {
      newErrors.fuelConsumedL = "Please enter valid fuel consumed (> 0 L).";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(Number(actualDistanceKm), Number(fuelConsumedL));
    onOpenChange(false);
  };

  if (!trip) return null;

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title="Complete Trip Delivery"
      description={`Record actual completion odometer metrics for route: ${trip.source} → ${trip.destination}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800/60 p-3 text-xs space-y-1 text-neutral-600 dark:text-neutral-300">
          <p>
            <span className="font-semibold">Vehicle:</span>{" "}
            {trip.vehicle?.name || "Assigned Vehicle"} (
            {trip.vehicle?.registration_number})
          </p>
          <p>
            <span className="font-semibold">Planned Distance:</span>{" "}
            {trip.planned_distance_km} km
          </p>
        </div>

        <div className="space-y-1.5">
          <Label required htmlFor="actualDistance">
            Actual Distance (km)
          </Label>
          <Input
            id="actualDistance"
            type="number"
            step="0.1"
            placeholder="e.g. 285.4"
            value={actualDistanceKm}
            onChange={(e) => setActualDistanceKm(e.target.value)}
            error={errors.actualDistanceKm}
          />
        </div>

        <div className="space-y-1.5">
          <Label required htmlFor="fuelConsumed">
            Fuel Consumed (Liters)
          </Label>
          <Input
            id="fuelConsumed"
            type="number"
            step="0.1"
            placeholder="e.g. 88.5"
            value={fuelConsumedL}
            onChange={(e) => setFuelConsumedL(e.target.value)}
            error={errors.fuelConsumedL}
          />
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="success">
            Mark Completed
          </Button>
        </div>
      </form>
    </ModalForm>
  );
}
