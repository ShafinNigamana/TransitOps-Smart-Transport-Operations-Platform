"use server";

import { pool } from "@/lib/db";
import { createMaintenanceSchema } from "@/lib/validations/maintenance.schema";
import type { ActionResult, Maintenance } from "@/types/database";
import { revalidatePath } from "next/cache";
import { assertRole } from "@/lib/actions/auth";

export async function createMaintenanceRecord(
  input: unknown
): Promise<ActionResult<Maintenance>> {
  const auth = await assertRole(["fleet_manager"]);
  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  const parsed = createMaintenanceSchema.safeParse(input);
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
    const vehicleRes = await pool.query(
      "SELECT status, name FROM public.vehicles WHERE id = $1",
      [parsed.data.vehicle_id]
    );

    if (vehicleRes.rows.length === 0) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Vehicle not found." },
      };
    }

    const vehicle = vehicleRes.rows[0];

    if (vehicle.status === "on_trip") {
      return {
        success: false,
        error: {
          code: "VEHICLE_ON_TRIP",
          message: `Cannot send vehicle ${vehicle.name} to the shop: It is currently active on a trip.`,
        },
      };
    }

    await pool.query(
      "UPDATE public.vehicles SET status = 'in_shop' WHERE id = $1",
      [parsed.data.vehicle_id]
    );

    try {
      const insertRes = await pool.query(
        `INSERT INTO public.maintenance 
          (vehicle_id, maintenance_type, description, cost, status, opened_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          parsed.data.vehicle_id,
          parsed.data.maintenance_type,
          parsed.data.description ?? null,
          parsed.data.cost,
          "open",
          new Date().toISOString(),
        ]
      );

      revalidatePath("/maintenance");
      revalidatePath("/dashboard");
      return { success: true, data: insertRes.rows[0] as Maintenance };
    } catch (insertErr: any) {
      await pool.query(
        "UPDATE public.vehicles SET status = $1 WHERE id = $2",
        [vehicle.status, parsed.data.vehicle_id]
      );
      return {
        success: false,
        error: { code: "INSERT_ERROR", message: insertErr.message || "Failed to insert record." },
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: { code: "UNKNOWN", message: error.message || "An error occurred." },
    };
  }
}

export async function closeMaintenanceRecord(
  recordId: string
): Promise<ActionResult<Maintenance>> {
  const auth = await assertRole(["fleet_manager"]);
  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  if (!recordId) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Record ID is required." },
    };
  }

  try {
    const recordRes = await pool.query(
      "SELECT status, vehicle_id FROM public.maintenance WHERE id = $1",
      [recordId]
    );

    if (recordRes.rows.length === 0) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Maintenance record not found." },
      };
    }

    const record = recordRes.rows[0];

    if (record.status !== "open") {
      return {
        success: false,
        error: {
          code: "INVALID_STATUS",
          message: `Only open repair tickets can be closed. Current status: ${record.status}`,
        },
      };
    }

    const updateRes = await pool.query(
      "UPDATE public.maintenance SET status = 'closed', closed_at = $1 WHERE id = $2 RETURNING *",
      [new Date().toISOString(), recordId]
    );

    const vehicleRes = await pool.query(
      "SELECT status FROM public.vehicles WHERE id = $1",
      [record.vehicle_id]
    );

    if (vehicleRes.rows.length > 0 && vehicleRes.rows[0].status !== "retired") {
      await pool.query(
        "UPDATE public.vehicles SET status = 'available' WHERE id = $1",
        [record.vehicle_id]
      );
    }

    revalidatePath("/maintenance");
    revalidatePath("/dashboard");
    return { success: true, data: updateRes.rows[0] as Maintenance };
  } catch (error: any) {
    return {
      success: false,
      error: { code: "UNKNOWN", message: error.message || "An error occurred." },
    };
  }
}
