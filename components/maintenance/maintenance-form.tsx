"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ModalForm } from "@/components/shared/modal-form";
import { CreateMaintenanceInput, Vehicle } from "@/types/database";

import { toast } from "sonner";

interface MaintenanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: Vehicle[];
  onSubmit: (data: CreateMaintenanceInput) => void;
}

const COMMON_MAINTENANCE_TYPES = [
  "Preventive Engine Service",
  "Brake Inspection & Pad Replacement",
  "Tire Alignment & Rotation",
  "Transmission Fluid & Overhaul",
  "Air Suspension & Axle Check",
  "Reefer Cooling Unit Calibration",
  "Electrical & Sensor Diagnostics",
  "Other Custom Repair",
];

export function MaintenanceForm({
  open,
  onOpenChange,
  vehicles,
  onSubmit,
}: MaintenanceFormProps) {
  const [vehicleId, setVehicleId] = React.useState("");
  const [maintenanceType, setMaintenanceType] = React.useState(
    COMMON_MAINTENANCE_TYPES[0]
  );
  const [customType, setCustomType] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [cost, setCost] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open) {
      setVehicleId("");
      setMaintenanceType(COMMON_MAINTENANCE_TYPES[0]);
      setCustomType("");
      setDescription("");
      setCost("");
      setErrors({});
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicleId) {
      newErrors.vehicleId = "Please select a vehicle.";
    } else if (selectedVehicle && selectedVehicle.status === "on_trip") {
      const errMsg = "Cannot start maintenance while the vehicle is currently on a trip.";
      newErrors.vehicleId = errMsg;
      toast.error(errMsg);
    }

    const finalType =
      maintenanceType === "Other Custom Repair"
        ? customType.trim()
        : maintenanceType;

    if (!finalType) {
      newErrors.maintenanceType = "Please specify the maintenance type.";
    }

    if (cost !== "" && Number(cost) < 0) {
      const errMsg = "Cost cannot be negative.";
      newErrors.cost = errMsg;
      toast.error(errMsg);
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (!newErrors.vehicleId && !newErrors.cost) {
        toast.error("Please fill in all required fields.");
      }
      return;
    }

    onSubmit({
      vehicle_id: vehicleId,
      maintenance_type: finalType,
      description: description.trim() || "Routine fleet workshop inspection.",
      cost: cost ? Number(cost) : 0,
    });

    onOpenChange(false);
  };

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title="Log Maintenance Record"
      description="Record workshop repair or inspection. Automatically marks new records as Open."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label required htmlFor="vehicleSelect">
            Vehicle
          </Label>
          <Select
            id="vehicleSelect"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            error={errors.vehicleId}
          >
            <option value="">Select vehicle...</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.registration_number}) — Status:{" "}
                {v.status.toUpperCase()}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label required htmlFor="maintenanceType">
            Maintenance Type
          </Label>
          <Select
            id="maintenanceType"
            value={maintenanceType}
            onChange={(e) => setMaintenanceType(e.target.value)}
            error={errors.maintenanceType}
          >
            {COMMON_MAINTENANCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </div>

        {maintenanceType === "Other Custom Repair" && (
          <div className="space-y-1.5">
            <Label required htmlFor="customType">
              Specify Custom Maintenance Type
            </Label>
            <Input
              id="customType"
              placeholder="e.g. Hydraulic Lift Assembly Overhaul"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              error={errors.maintenanceType}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            rows={3}
            placeholder="Details of the issue, parts replaced, or service actions..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label required htmlFor="cost">
            Cost (₹ INR)
          </Label>
          <Input
            id="cost"
            type="number"
            step="0.01"
            placeholder="e.g. 1250.00"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            error={errors.cost}
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
          <Button type="submit">Log Maintenance</Button>
        </div>
      </form>
    </ModalForm>
  );
}
