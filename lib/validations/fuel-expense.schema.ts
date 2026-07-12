import { z } from "zod";

// ── Fuel Log Schema (SYSTEM_ARCHITECTURE.md §3.9) ──────────────────────────
export const createFuelLogSchema = z.object({
  vehicle_id: z.string().uuid("Invalid vehicle ID format"),
  trip_id: z.string().uuid("Invalid trip ID format").optional().or(z.literal("")),
  liters: z.number().positive("Liters must be greater than 0"),
  cost: z.number().nonnegative("Cost cannot be negative"),
  log_date: z.coerce.date(),
});

export type CreateFuelLogInput = z.infer<typeof createFuelLogSchema>;

// ── Expense Schema (SYSTEM_ARCHITECTURE.md §3.10) ──────────────────────────
export const createExpenseSchema = z.object({
  vehicle_id: z.string().uuid("Invalid vehicle ID format").optional().or(z.literal("")),
  trip_id: z.string().uuid("Invalid trip ID format").optional().or(z.literal("")),
  category: z.string().min(1, "Expense category is required"),
  amount: z.number().nonnegative("Expense amount cannot be negative"),
  expense_date: z.coerce.date(),
  notes: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
