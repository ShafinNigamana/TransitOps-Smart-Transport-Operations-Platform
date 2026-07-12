"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ModalForm } from "@/components/shared/modal-form";
import { CreateTripInput, Driver, Vehicle } from "@/types/database";

import { toast } from "sonner";

interface TripFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: Vehicle[];
  drivers: Driver[];
  onSubmit: (tripData: CreateTripInput) => void;
}

export function TripForm({
  open,
  onOpenChange,
  vehicles,
  drivers,
  onSubmit,
}: TripFormProps) {
  const [source, setSource] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [cargoWeightKg, setCargoWeightKg] = React.useState("");
  const [plannedDistanceKm, setPlannedDistanceKm] = React.useState("");
  const [vehicleId, setVehicleId] = React.useState("");
  const [driverId, setDriverId] = React.useState("");

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setSource("");
      setDestination("");
      setCargoWeightKg("");
      setPlannedDistanceKm("");
      setVehicleId("");
      setDriverId("");
      setErrors({});
    }
  }, [open]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysLimit = new Date();
  thirtyDaysLimit.setDate(today.getDate() + 30);
  thirtyDaysLimit.setHours(0, 0, 0, 0);

  const availableVehicles = vehicles.filter((v) => v.status === "available");
  const availableDrivers = drivers.filter((d) => {
    if (d.status !== "available") return false;
    const expiry = new Date(d.license_expiry_date);
    expiry.setHours(0, 0, 0, 0);
    return expiry >= thirtyDaysLimit;
  });

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const selectedDriver = drivers.find((d) => d.id === driverId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!source.trim()) newErrors.source = "Source location is required.";
    if (!destination.trim())
      newErrors.destination = "Destination is required.";
    if (!cargoWeightKg || Number(cargoWeightKg) <= 0)
      newErrors.cargoWeightKg = "Valid cargo weight (> 0 kg) is required.";
    if (!plannedDistanceKm || Number(plannedDistanceKm) <= 0)
      newErrors.plannedDistanceKm = "Valid distance (> 0 km) is required.";
    if (!vehicleId) newErrors.vehicleId = "Please select a vehicle.";
    if (!driverId) newErrors.driverId = "Please select a driver.";

    // Business rule check: cargo weight vs vehicle capacity
    if (
      selectedVehicle &&
      Number(cargoWeightKg) > selectedVehicle.max_load_capacity_kg
    ) {
      const errMsg = `Cargo weight (${cargoWeightKg} kg) exceeds ${selectedVehicle.name}'s limit (${selectedVehicle.max_load_capacity_kg} kg).`;
      newErrors.cargoWeightKg = errMsg;
      toast.error(errMsg);
    }

    if (selectedDriver) {
      const expiry = new Date(selectedDriver.license_expiry_date);
      expiry.setHours(0, 0, 0, 0);
      if (expiry < thirtyDaysLimit) {
        const errMsg = expiry < today
          ? `Driver license expired on ${selectedDriver.license_expiry_date}.`
          : `Driver license expires within 30 days (on ${selectedDriver.license_expiry_date}).`;
        newErrors.driverId = errMsg;
        toast.error(errMsg);
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (!newErrors.cargoWeightKg && !newErrors.driverId) {
        toast.error("Please fill in all required fields.");
      }
      return;
    }

    onSubmit({
      source: source.trim(),
      destination: destination.trim(),
      cargo_weight_kg: Number(cargoWeightKg),
      planned_distance_km: Number(plannedDistanceKm),
      vehicle_id: vehicleId,
      driver_id: driverId,
    });

    onOpenChange(false);
  };

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Trip"
      description="Assign a route, cargo weight, vehicle, and driver. New trips start in Draft status."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label required htmlFor="source">
              Source
            </Label>
            <Input
              id="source"
              placeholder="e.g. Seattle Port Terminal 18"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              error={errors.source}
            />
          </div>
          <div className="space-y-1.5">
            <Label required htmlFor="destination">
              Destination
            </Label>
            <Input
              id="destination"
              placeholder="e.g. Portland Distribution Hub"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              error={errors.destination}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label required htmlFor="cargoWeight">
              Cargo Weight (kg)
            </Label>
            <Input
              id="cargoWeight"
              type="number"
              step="0.1"
              placeholder="e.g. 15000"
              value={cargoWeightKg}
              onChange={(e) => setCargoWeightKg(e.target.value)}
              error={errors.cargoWeightKg}
            />
            {selectedVehicle && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Max load capacity: {selectedVehicle.max_load_capacity_kg} kg
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label required htmlFor="plannedDistance">
              Planned Distance (km)
            </Label>
            <Input
              id="plannedDistance"
              type="number"
              step="0.1"
              placeholder="e.g. 280"
              value={plannedDistanceKm}
              onChange={(e) => setPlannedDistanceKm(e.target.value)}
              error={errors.plannedDistanceKm}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label required htmlFor="vehicleSelect">
            Vehicle Select
          </Label>
          <Select
            id="vehicleSelect"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            error={errors.vehicleId}
          >
            <option value="">Select an available vehicle...</option>
            {availableVehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.registration_number}) • Cap:{" "}
                {v.max_load_capacity_kg} kg
              </option>
            ))}
          </Select>
          {availableVehicles.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              No vehicles currently available for dispatch.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label required htmlFor="driverSelect">
            Driver Select
          </Label>
          <Select
            id="driverSelect"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            error={errors.driverId}
          >
            <option value="">Select an available driver...</option>
            {availableDrivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name} • License: {d.license_category}
              </option>
            ))}
          </Select>
          {availableDrivers.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              No drivers currently available for dispatch.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit">Create Trip</Button>
        </div>
      </form>
    </ModalForm>
  );
}
