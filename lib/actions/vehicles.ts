"use server";

import { createClient } from "@/lib/supabase/server";
import { createVehicleSchema, updateVehicleSchema } from "@/lib/validations/vehicle.schema";
import type { ActionResult, Vehicle } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function createVehicle(
  input: unknown
): Promise<ActionResult<Vehicle>> {
  const parsed = createVehicleSchema.safeParse(input);
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
    .from("vehicles")
    .insert({
      registration_number: parsed.data.registrationNumber,
      name: parsed.data.name,
      vehicle_type: parsed.data.vehicleType,
      max_load_capacity_kg: parsed.data.maxLoadCapacityKg,
      odometer_km: parsed.data.odometerKm,
      acquisition_cost: parsed.data.acquisitionCost,
      region: parsed.data.region ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: {
          code: "DUPLICATE_REGISTRATION",
          message: "A vehicle with this registration number already exists.",
        },
      };
    }
    return {
      success: false,
      error: { code: "UNKNOWN", message: "Failed to create vehicle." },
    };
  }

  revalidatePath("/vehicles");
  revalidatePath("/dashboard");
  return { success: true, data: data as Vehicle };
}

export async function updateVehicle(
  input: unknown
): Promise<ActionResult<Vehicle>> {
  const parsed = updateVehicleSchema.safeParse(input);
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
  if (fields.registrationNumber !== undefined)
    updatePayload.registration_number = fields.registrationNumber;
  if (fields.name !== undefined) updatePayload.name = fields.name;
  if (fields.vehicleType !== undefined)
    updatePayload.vehicle_type = fields.vehicleType;
  if (fields.maxLoadCapacityKg !== undefined)
    updatePayload.max_load_capacity_kg = fields.maxLoadCapacityKg;
  if (fields.odometerKm !== undefined)
    updatePayload.odometer_km = fields.odometerKm;
  if (fields.acquisitionCost !== undefined)
    updatePayload.acquisition_cost = fields.acquisitionCost;
  if (fields.region !== undefined) updatePayload.region = fields.region;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: {
          code: "DUPLICATE_REGISTRATION",
          message: "A vehicle with this registration number already exists.",
        },
      };
    }
    return {
      success: false,
      error: { code: "UNKNOWN", message: "Failed to update vehicle." },
    };
  }

  revalidatePath("/vehicles");
  revalidatePath("/dashboard");
  return { success: true, data: data as Vehicle };
}

export async function retireVehicle(
  vehicleId: string
): Promise<ActionResult<Vehicle>> {
  if (!vehicleId) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Vehicle ID is required." },
    };
  }

  const supabase = await createClient();

  // Check current status — cannot retire a vehicle that is on_trip
  const { data: vehicle, error: fetchError } = await supabase
    .from("vehicles")
    .select("id, status")
    .eq("id", vehicleId)
    .single();

  if (fetchError || !vehicle) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "Vehicle not found." },
    };
  }

  if (vehicle.status === "on_trip") {
    return {
      success: false,
      error: {
        code: "VEHICLE_ON_TRIP",
        message:
          "Cannot retire a vehicle that is currently on a trip. Complete or cancel the trip first.",
      },
    };
  }

  if (vehicle.status === "retired") {
    return {
      success: false,
      error: {
        code: "ALREADY_RETIRED",
        message: "This vehicle is already retired.",
      },
    };
  }

  const { data, error } = await supabase
    .from("vehicles")
    .update({ status: "retired" })
    .eq("id", vehicleId)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      error: { code: "UNKNOWN", message: "Failed to retire vehicle." },
    };
  }

  revalidatePath("/vehicles");
  revalidatePath("/dashboard");
  return { success: true, data: data as Vehicle };
}
