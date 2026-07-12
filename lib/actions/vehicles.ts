"use server";

import { pool } from "@/lib/db";
import { createVehicleSchema, updateVehicleSchema } from "@/lib/validations/vehicle.schema";
import type { ActionResult, Vehicle } from "@/types/database";
import { revalidatePath } from "next/cache";
import { assertRole } from "@/lib/actions/auth";

export async function createVehicle(
  input: unknown
): Promise<ActionResult<Vehicle>> {
  const auth = await assertRole(["fleet_manager"]);
  if (!auth.success) {
    return { success: false, error: auth.error };
  }

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

  try {
    const dbRes = await pool.query(
      `INSERT INTO public.vehicles 
        (registration_number, name, vehicle_type, max_load_capacity_kg, odometer_km, acquisition_cost, region)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        parsed.data.registrationNumber,
        parsed.data.name,
        parsed.data.vehicleType,
        parsed.data.maxLoadCapacityKg,
        parsed.data.odometerKm,
        parsed.data.acquisitionCost,
        parsed.data.region ?? null,
      ]
    );

    revalidatePath("/vehicles");
    revalidatePath("/dashboard");
    return { success: true, data: dbRes.rows[0] as Vehicle };
  } catch (error: any) {
    console.error("error during createVehicle:", error);
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
      error: { code: "UNKNOWN", message: error.message || "Failed to create vehicle." },
    };
  }
}

export async function updateVehicle(
  input: unknown
): Promise<ActionResult<Vehicle>> {
  const auth = await assertRole(["fleet_manager"]);
  if (!auth.success) {
    return { success: false, error: auth.error };
  }

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

  try {
    const keys = Object.keys(updatePayload);
    const params: any[] = [];
    let pIdx = 1;

    const setClause = keys.map(k => {
      params.push(updatePayload[k]);
      return `${k} = $${pIdx++}`;
    }).join(", ");

    params.push(id);
    const sql = `UPDATE public.vehicles SET ${setClause} WHERE id = $${pIdx} RETURNING *`;
    const dbRes = await pool.query(sql, params);

    if (dbRes.rows.length === 0) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Vehicle not found." },
      };
    }

    revalidatePath("/vehicles");
    revalidatePath("/dashboard");
    return { success: true, data: dbRes.rows[0] as Vehicle };
  } catch (error: any) {
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
      error: { code: "UNKNOWN", message: error.message || "Failed to update vehicle." },
    };
  }
}

export async function retireVehicle(
  vehicleId: string
): Promise<ActionResult<Vehicle>> {
  const auth = await assertRole(["fleet_manager"]);
  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  if (!vehicleId) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Vehicle ID is required." },
    };
  }

  try {
    const fetchRes = await pool.query("SELECT id, status FROM public.vehicles WHERE id = $1", [vehicleId]);
    if (fetchRes.rows.length === 0) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Vehicle not found." },
      };
    }

    const vehicle = fetchRes.rows[0];

    if (vehicle.status === "on_trip") {
      return {
        success: false,
        error: {
          code: "VEHICLE_ON_TRIP",
          message: "Cannot retire a vehicle that is currently on a trip. Complete or cancel the trip first.",
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

    const updateRes = await pool.query(
      "UPDATE public.vehicles SET status = 'retired' WHERE id = $1 RETURNING *",
      [vehicleId]
    );

    revalidatePath("/vehicles");
    revalidatePath("/dashboard");
    return { success: true, data: updateRes.rows[0] as Vehicle };
  } catch (error: any) {
    return {
      success: false,
      error: { code: "UNKNOWN", message: error.message || "Failed to retire vehicle." },
    };
  }
}
