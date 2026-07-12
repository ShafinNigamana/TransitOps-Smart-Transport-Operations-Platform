import { z } from "zod";

export const createMaintenanceSchema = z.object({
  vehicle_id: z.string().uuid("Invalid vehicle ID format"),
  maintenance_type: z.string().min(1, "Maintenance type is required"),
  description: z.string().optional(),
  cost: z.number().nonnegative("Cost cannot be negative"),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
