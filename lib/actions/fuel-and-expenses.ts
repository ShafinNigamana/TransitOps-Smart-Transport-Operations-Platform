"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createFuelLogSchema,
  createExpenseSchema,
} from "@/lib/validations/fuel-expense.schema";
import type { ActionResult, FuelLog, Expense } from "@/types/database";
import { revalidatePath } from "next/cache";

// ── Fuel Logs ───────────────────────────────────────────────────────────────

export async function createFuelLog(
  input: unknown
): Promise<ActionResult<FuelLog>> {
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

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("fuel_logs")
    .insert({
      vehicle_id: parsed.data.vehicle_id,
      trip_id: parsed.data.trip_id || null,
      liters: parsed.data.liters,
      cost: parsed.data.cost,
      log_date: parsed.data.log_date.toISOString().split("T")[0],
    })
    .select("*, vehicle:vehicles(*)")
    .single();

  if (error) {
    return {
      success: false,
      error: { code: "INSERT_ERROR", message: error.message },
    };
  }

  revalidatePath("/fuel-logs");
  revalidatePath("/analytics");
  revalidatePath("/dashboard");
  return { success: true, data: data as FuelLog };
}

export async function getFuelLogs(): Promise<ActionResult<FuelLog[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("fuel_logs")
    .select("*, vehicle:vehicles(*)")
    .order("log_date", { ascending: false });

  if (error) {
    return {
      success: false,
      error: { code: "QUERY_ERROR", message: "Failed to fetch fuel logs." },
    };
  }

  return { success: true, data: (data ?? []) as FuelLog[] };
}

// ── Expenses ────────────────────────────────────────────────────────────────

export async function createExpense(
  input: unknown
): Promise<ActionResult<Expense>> {
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

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      vehicle_id: parsed.data.vehicle_id || null,
      trip_id: parsed.data.trip_id || null,
      category: parsed.data.category,
      amount: parsed.data.amount,
      expense_date: parsed.data.expense_date.toISOString().split("T")[0],
      notes: parsed.data.notes ?? null,
    })
    .select("*, vehicle:vehicles(*)")
    .single();

  if (error) {
    return {
      success: false,
      error: { code: "INSERT_ERROR", message: error.message },
    };
  }

  revalidatePath("/expenses");
  revalidatePath("/analytics");
  revalidatePath("/dashboard");
  return { success: true, data: data as Expense };
}

export async function getExpenses(): Promise<ActionResult<Expense[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("expenses")
    .select("*, vehicle:vehicles(*)")
    .order("expense_date", { ascending: false });

  if (error) {
    return {
      success: false,
      error: { code: "QUERY_ERROR", message: "Failed to fetch expenses." },
    };
  }

  return { success: true, data: (data ?? []) as Expense[] };
}
