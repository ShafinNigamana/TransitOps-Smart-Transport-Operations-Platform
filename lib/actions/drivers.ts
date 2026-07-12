"use server";

import { createClient } from "@/lib/supabase/server";
import { createDriverSchema, updateDriverSchema } from "@/lib/validations/driver.schema";
import type { ActionResult, Driver } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function createDriver(
  input: unknown
): Promise<ActionResult<Driver>> {
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

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drivers")
    .insert({
      full_name: parsed.data.fullName,
      license_number: parsed.data.licenseNumber,
      license_category: parsed.data.licenseCategory,
      license_expiry_date: parsed.data.licenseExpiryDate,
      contact_number: parsed.data.contactNumber,
      safety_score: parsed.data.safetyScore,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase error during createDriver:", error);
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

  revalidatePath("/drivers");
  revalidatePath("/dashboard");
  return { success: true, data: data as Driver };
}

export async function updateDriver(
  input: unknown
): Promise<ActionResult<Driver>> {
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

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drivers")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
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
      error: { code: "UNKNOWN", message: "Failed to update driver." },
    };
  }

  revalidatePath("/drivers");
  revalidatePath("/dashboard");
  return { success: true, data: data as Driver };
}

export async function suspendDriver(
  driverId: string
): Promise<ActionResult<Driver>> {
  if (!driverId) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Driver ID is required." },
    };
  }

  const supabase = await createClient();

  const { data: driver, error: fetchError } = await supabase
    .from("drivers")
    .select("id, status")
    .eq("id", driverId)
    .single();

  if (fetchError || !driver) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "Driver not found." },
    };
  }

  if (driver.status === "on_trip") {
    return {
      success: false,
      error: {
        code: "DRIVER_ON_TRIP",
        message:
          "Cannot suspend a driver who is currently on a trip. Complete or cancel the trip first.",
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

  const { data, error } = await supabase
    .from("drivers")
    .update({ status: "suspended" })
    .eq("id", driverId)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      error: { code: "UNKNOWN", message: "Failed to suspend driver." },
    };
  }

  revalidatePath("/drivers");
  revalidatePath("/dashboard");
  return { success: true, data: data as Driver };
}
