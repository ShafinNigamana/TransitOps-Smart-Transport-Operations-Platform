import { z } from "zod";

export const createTripSchema = z.object({
  source: z.string().min(1, "Starting location (source) is required"),
  destination: z.string().min(1, "Destination is required"),
  cargo_weight_kg: z.number().positive("Cargo weight must be greater than 0"),
  planned_distance_km: z.number().positive("Planned distance must be greater than 0"),
  vehicle_id: z.string().uuid("Invalid vehicle ID format"),
  driver_id: z.string().uuid("Invalid driver ID format"),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;

export const completeTripSchema = z.object({
  trip_id: z.string().uuid("Invalid trip ID format"),
  actual_distance_km: z.number().positive("Actual distance must be greater than 0"),
  fuel_consumed_l: z.number().positive("Fuel consumed must be greater than 0"),
});

export type CompleteTripInput = z.infer<typeof completeTripSchema>;
