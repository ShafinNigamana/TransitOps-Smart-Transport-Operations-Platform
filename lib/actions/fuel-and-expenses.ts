"use server";

import { pool } from "@/lib/db";
import {
  createFuelLogSchema,
  createExpenseSchema,
} from "@/lib/validations/fuel-expense.schema";
import type { ActionResult, FuelLog, Expense } from "@/types/database";
import { revalidatePath } from "next/cache";
import { assertRole } from "@/lib/actions/auth";

// ── Fuel Logs ───────────────────────────────────────────────────────────────

export async function createFuelLog(
  input: unknown
): Promise<ActionResult<FuelLog>> {
  const auth = await assertRole(["financial_analyst", "driver"]);
  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  const parsed = createFuelLogSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid input parameters.",
      },
    };
  }

  try {
    const insertRes = await pool.query(
      `INSERT INTO public.fuel_logs 
        (vehicle_id, trip_id, liters, cost, log_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        parsed.data.vehicle_id,
        parsed.data.trip_id || null,
        parsed.data.liters,
        parsed.data.cost,
        parsed.data.log_date.toISOString().split("T")[0],
      ]
    );

    const log = insertRes.rows[0];

    const fetchRes = await pool.query(
      `SELECT f.*, row_to_json(v) AS vehicle
       FROM public.fuel_logs f
       LEFT JOIN public.vehicles v ON f.vehicle_id = v.id
       WHERE f.id = $1`,
      [log.id]
    );

    revalidatePath("/fuel-logs");
    revalidatePath("/analytics");
    revalidatePath("/dashboard");
    return { success: true, data: fetchRes.rows[0] as FuelLog };
  } catch (error: any) {
    return {
      success: false,
      error: { code: "INSERT_ERROR", message: error.message || "Failed to create fuel log." },
    };
  }
}

export async function getFuelLogs(): Promise<ActionResult<FuelLog[]>> {
  try {
    const dbRes = await pool.query(
      `SELECT f.*, row_to_json(v) AS vehicle
       FROM public.fuel_logs f
       LEFT JOIN public.vehicles v ON f.vehicle_id = v.id
       ORDER BY f.log_date DESC`
    );
    return { success: true, data: dbRes.rows as FuelLog[] };
  } catch (error: any) {
    return {
      success: false,
      error: { code: "QUERY_ERROR", message: error.message || "Failed to fetch fuel logs." },
    };
  }
}

// ── Expenses ────────────────────────────────────────────────────────────────

export async function createExpense(
  input: unknown
): Promise<ActionResult<Expense>> {
  const auth = await assertRole(["financial_analyst", "driver"]);
  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  const parsed = createExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid input parameters.",
      },
    };
  }

  try {
    const insertRes = await pool.query(
      `INSERT INTO public.expenses 
        (vehicle_id, trip_id, category, amount, expense_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        parsed.data.vehicle_id || null,
        parsed.data.trip_id || null,
        parsed.data.category,
        parsed.data.amount,
        parsed.data.expense_date.toISOString().split("T")[0],
        parsed.data.notes ?? null,
      ]
    );

    const expense = insertRes.rows[0];

    const fetchRes = await pool.query(
      `SELECT e.*, row_to_json(v) AS vehicle
       FROM public.expenses e
       LEFT JOIN public.vehicles v ON e.vehicle_id = v.id
       WHERE e.id = $1`,
      [expense.id]
    );

    revalidatePath("/expenses");
    revalidatePath("/analytics");
    revalidatePath("/dashboard");
    return { success: true, data: fetchRes.rows[0] as Expense };
  } catch (error: any) {
    return {
      success: false,
      error: { code: "INSERT_ERROR", message: error.message || "Failed to create expense." },
    };
  }
}

export async function getExpenses(): Promise<ActionResult<Expense[]>> {
  try {
    const dbRes = await pool.query(
      `SELECT e.*, row_to_json(v) AS vehicle
       FROM public.expenses e
       LEFT JOIN public.vehicles v ON e.vehicle_id = v.id
       ORDER BY e.expense_date DESC`
    );
    return { success: true, data: dbRes.rows as Expense[] };
  } catch (error: any) {
    return {
      success: false,
      error: { code: "QUERY_ERROR", message: error.message || "Failed to fetch expenses." },
    };
  }
}
