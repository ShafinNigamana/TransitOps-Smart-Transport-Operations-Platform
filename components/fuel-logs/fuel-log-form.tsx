"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ModalForm } from "@/components/shared/modal-form";
import type { Vehicle, Trip, CreateFuelLogInput } from "@/types/database";

interface FuelLogFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: Vehicle[];
  trips: Trip[];
  onSubmit: (data: CreateFuelLogInput) => void;
}

export function FuelLogForm({
  open,
  onOpenChange,
  vehicles,
  trips,
  onSubmit,
}: FuelLogFormProps) {
  const [vehicleId, setVehicleId] = React.useState("");
  const [tripId, setTripId] = React.useState("");
  const [liters, setLiters] = React.useState("");
  const [cost, setCost] = React.useState("");
  const [logDate, setLogDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open) {
      setVehicleId("");
      setTripId("");
      setLiters("");
      setCost("");
      setLogDate(new Date().toISOString().split("T")[0]);
      setErrors({});
    }
  }, [open]);

  // Filter trips by selected vehicle
  const filteredTrips = vehicleId
    ? trips.filter((t) => t.vehicle_id === vehicleId)
    : trips;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!vehicleId) {
      newErrors.vehicleId = "Please select a vehicle.";
    }

    const litersNum = Number(liters);
    if (!liters || litersNum <= 0) {
      newErrors.liters = "Liters must be greater than 0.";
    }

    const costNum = Number(cost);
    if (cost !== "" && costNum < 0) {
      newErrors.cost = "Cost cannot be negative.";
    }

    if (!logDate) {
      newErrors.logDate = "Log date is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      vehicle_id: vehicleId,
      trip_id: tripId || undefined,
      liters: litersNum,
      cost: cost ? costNum : 0,
      log_date: logDate,
    });
  };

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title="Log Fuel Entry"
      description="Record a fuel purchase for a fleet vehicle. Optionally link to a specific trip."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label required htmlFor="fuelVehicleSelect">
            Vehicle
          </Label>
          <Select
            id="fuelVehicleSelect"
            value={vehicleId}
            onChange={(e) => {
              setVehicleId(e.target.value);
              setTripId("");
            }}
            error={errors.vehicleId}
          >
            <option value="">Select vehicle...</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.registration_number})
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fuelTripSelect">
            Trip <span className="text-xs text-neutral-400">(optional)</span>
          </Label>
          <Select
            id="fuelTripSelect"
            value={tripId}
            onChange={(e) => setTripId(e.target.value)}
          >
            <option value="">No linked trip</option>
            {filteredTrips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.source} → {t.destination} ({t.status})
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label required htmlFor="fuelLiters">
              Liters
            </Label>
            <Input
              id="fuelLiters"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 125.50"
              value={liters}
              onChange={(e) => setLiters(e.target.value)}
              error={errors.liters}
            />
          </div>

          <div className="space-y-1.5">
            <Label required htmlFor="fuelCost">
              Cost ($ USD)
            </Label>
            <Input
              id="fuelCost"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 250.00"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              error={errors.cost}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label required htmlFor="fuelDate">
            Log Date
          </Label>
          <Input
            id="fuelDate"
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            error={errors.logDate}
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit">Log Fuel Entry</Button>
        </div>
      </form>
    </ModalForm>
  );
}
