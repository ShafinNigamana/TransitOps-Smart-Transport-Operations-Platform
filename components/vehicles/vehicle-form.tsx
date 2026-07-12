"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createVehicleSchema, type CreateVehicleInput } from "@/lib/validations/vehicle.schema";
import { createVehicle } from "@/lib/actions/vehicles";
import { Loader2 } from "lucide-react";

import { toast } from "sonner";

interface VehicleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const VEHICLE_TYPES = [
  "Heavy Semi-Trailer",
  "Refrigerated Truck",
  "Dry Van Truck",
  "Medium Freight Truck",
  "Flatbed Trailer",
  "Tanker Truck",
  "Box Truck",
  "Cargo Van",
];

const REGIONS = [
  "North Corridor",
  "South Corridor",
  "East Port Express",
  "West Coast Route",
  "Central Hub",
  "Southern Coastal",
];

export function VehicleForm({ open, onOpenChange, onSuccess }: VehicleFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);

  const formRef = React.useRef<HTMLFormElement>(null);

  const resetForm = () => {
    formRef.current?.reset();
    setErrors({});
    setServerError(null);
  };

  const handleClose = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const formData = new FormData(e.currentTarget);
    const rawInput: CreateVehicleInput = {
      registrationNumber: (formData.get("registrationNumber") as string)?.trim() ?? "",
      name: (formData.get("name") as string)?.trim() ?? "",
      vehicleType: (formData.get("vehicleType") as string) ?? "",
      maxLoadCapacityKg: Number(formData.get("maxLoadCapacityKg")) || 0,
      odometerKm: Number(formData.get("odometerKm")) || 0,
      acquisitionCost: Number(formData.get("acquisitionCost")) || 0,
      region: (formData.get("region") as string) || undefined,
    };

    // Client-side Zod validation
    const parsed = createVehicleSchema.safeParse(rawInput);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createVehicle(parsed.data);
      if (result.success) {
        toast.success("Vehicle registered successfully");
        resetForm();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error.message);
        setServerError(result.error.message);
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
      setServerError("Something went wrong — please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogHeader>
        <DialogTitle>Register New Vehicle</DialogTitle>
        <DialogDescription>
          Add a new vehicle to the fleet registry. All fields marked with * are required.
        </DialogDescription>
      </DialogHeader>

      {serverError && (
        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 px-4 py-3 text-sm text-rose-700 dark:text-rose-400 mb-4">
          {serverError}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
        {/* Registration Number */}
        <div className="space-y-2">
          <Label htmlFor="vehicle-reg" required>Registration Number</Label>
          <Input
            id="vehicle-reg"
            name="registrationNumber"
            placeholder="e.g. KA-01-AB-1234"
            error={errors.registrationNumber}
          />
        </div>

        {/* Name / Model */}
        <div className="space-y-2">
          <Label htmlFor="vehicle-name" required>Name / Model</Label>
          <Input
            id="vehicle-name"
            name="name"
            placeholder="e.g. Volvo FH16 Heavy Duty"
            error={errors.name}
          />
        </div>

        {/* Vehicle Type + Region — side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vehicle-type" required>Vehicle Type</Label>
            <Select id="vehicle-type" name="vehicleType" error={errors.vehicleType} defaultValue="">
              <option value="" disabled>Select type…</option>
              {VEHICLE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle-region">Region</Label>
            <Select id="vehicle-region" name="region" defaultValue="">
              <option value="">No region</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Capacity, Odometer, Cost — three-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vehicle-capacity" required>Max Load (kg)</Label>
            <Input
              id="vehicle-capacity"
              name="maxLoadCapacityKg"
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              error={errors.maxLoadCapacityKg}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle-odometer">Odometer (km)</Label>
            <Input
              id="vehicle-odometer"
              name="odometerKm"
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              error={errors.odometerKm}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle-cost">Acq. Cost (₹)</Label>
            <Input
              id="vehicle-cost"
              name="acquisitionCost"
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              error={errors.acquisitionCost}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Registering…" : "Register Vehicle"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
