import { z } from "zod";

export const createVehicleSchema = z.object({
  registrationNumber: z
    .string()
    .regex(/^[A-Za-z0-9-]{2,20}$/, "Use 2–20 letters, numbers, or hyphens"),
  name: z.string().min(1, "Vehicle name is required"),
  vehicleType: z.string().min(1, "Vehicle type is required"),
  maxLoadCapacityKg: z.number().positive("Capacity must be greater than 0"),
  odometerKm: z.number().nonnegative("Odometer cannot be negative"),
  acquisitionCost: z.number().nonnegative("Acquisition cost cannot be negative"),
  region: z.string().optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
