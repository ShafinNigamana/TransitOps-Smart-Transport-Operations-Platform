"use server";

import { pool } from "@/lib/db";
import { createDriverSchema, updateDriverSchema } from "@/lib/validations/driver.schema";
import type { ActionResult, Driver } from "@/types/database";
import { revalidatePath } from "next/cache";
import { assertRole } from "@/lib/actions/auth";

export async function createDriver(
  input: unknown
): Promise<ActionResult<Driver>> {
  const auth = await assertRole(["fleet_manager", "safety_officer"]);
  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  const parsed = createDriverSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: firstError?.message ?? "Invalid input",
      },
    };
  }

  try {
    const dbRes = await pool.query(
      `INSERT INTO public.drivers 
        (full_name, license_number, license_category, license_expiry_date, contact_number, safety_score)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        parsed.data.fullName,
        parsed.data.licenseNumber,
        parsed.data.licenseCategory,
        parsed.data.licenseExpiryDate,
        parsed.data.contactNumber,
        parsed.data.safetyScore,
      ]
    );

    revalidatePath("/drivers");
    revalidatePath("/dashboard");
    return { success: true, data: dbRes.rows[0] as Driver };
  } catch (error: any) {
    console.error("error during createDriver:", error);
    if (error.code === "23505") {
      return {
        success: false,
        error: {
          code: "DUPLICATE_LICENSE",
          message: "A driver with this license number already exists.",
        },
      };
    }
    return {
      success: false,
      error: { code: "UNKNOWN", message: error.message || "Failed to create driver." },
    };
  }
}

export async function updateDriver(
  input: unknown
): Promise<ActionResult<Driver>> {
  const auth = await assertRole(["fleet_manager", "safety_officer"]);
  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  const parsed = updateDriverSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: firstError?.message ?? "Invalid input",
      },
    };
  }

  const { id, ...fields } = parsed.data;
  const updatePayload: Record<string, unknown> = {};
  if (fields.fullName !== undefined) updatePayload.full_name = fields.fullName;
  if (fields.licenseNumber !== undefined) updatePayload.license_number = fields.licenseNumber;
  if (fields.licenseCategory !== undefined) updatePayload.license_category = fields.licenseCategory;
  if (fields.licenseExpiryDate !== undefined) updatePayload.license_expiry_date = fields.licenseExpiryDate;
  if (fields.contactNumber !== undefined) updatePayload.contact_number = fields.contactNumber;
  if (fields.safetyScore !== undefined) updatePayload.safety_score = fields.safetyScore;

  try {
    const keys = Object.keys(updatePayload);
    const params: any[] = [];
    let pIdx = 1;

    const setClause = keys.map(k => {
      params.push(updatePayload[k]);
      return `${k} = $${pIdx++}`;
    }).join(", ");

    params.push(id);
    const sql = `UPDATE public.drivers SET ${setClause} WHERE id = $${pIdx} RETURNING *`;
    const dbRes = await pool.query(sql, params);

    if (dbRes.rows.length === 0) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Driver not found." },
      };
    }

    revalidatePath("/drivers");
    revalidatePath("/dashboard");
    return { success: true, data: dbRes.rows[0] as Driver };
  } catch (error: any) {
    if (error.code === "23505") {
      return {
        success: false,
        error: {
          code: "DUPLICATE_LICENSE",
          message: "A driver with this license number already exists.",
        },
      };
    }
    return {
      success: false,
      error: { code: "UNKNOWN", message: error.message || "Failed to update driver." },
    };
  }
}

export async function suspendDriver(
  driverId: string
): Promise<ActionResult<Driver>> {
  const auth = await assertRole(["safety_officer"]);
  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  if (!driverId) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Driver ID is required." },
    };
  }

  try {
    const fetchRes = await pool.query("SELECT id, status FROM public.drivers WHERE id = $1", [driverId]);
    if (fetchRes.rows.length === 0) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Driver not found." },
      };
    }

    const driver = fetchRes.rows[0];

    if (driver.status === "on_trip") {
      return {
        success: false,
        error: {
          code: "DRIVER_ON_TRIP",
          message: "Cannot suspend a driver who is currently on a trip. Complete or cancel the trip first.",
        },
      };
    }

    if (driver.status === "suspended") {
      return {
        success: false,
        error: {
          code: "ALREADY_SUSPENDED",
          message: "This driver is already suspended.",
        },
      };
    }

    const updateRes = await pool.query(
      "UPDATE public.drivers SET status = 'suspended' WHERE id = $1 RETURNING *",
      [driverId]
    );

    revalidatePath("/drivers");
    revalidatePath("/dashboard");
    return { success: true, data: updateRes.rows[0] as Driver };
  } catch (error: any) {
    return {
      success: false,
      error: { code: "UNKNOWN", message: error.message || "Failed to suspend driver." },
    };
  }
}
