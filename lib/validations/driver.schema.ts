import { z } from "zod";

export const createDriverSchema = z.object({
  fullName: z.string().min(1, "Driver name is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseCategory: z.string().min(1, "License category is required"),
  licenseExpiryDate: z.string().min(1, "License expiry date is required"),
  contactNumber: z.string().min(7, "Contact number must be at least 7 characters"),
  safetyScore: z.number().min(0).max(100).default(100),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;

export const updateDriverSchema = createDriverSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
