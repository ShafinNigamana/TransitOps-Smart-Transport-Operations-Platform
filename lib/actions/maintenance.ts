"use server";

import { createClient } from "@/lib/supabase/server";
import { createMaintenanceSchema } from "@/lib/validations/maintenance.schema";
import type { ActionResult, Maintenance } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function createMaintenanceRecord(
  input: unknown
): Promise<ActionResult<Maintenance>> {
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

  const supabase = await createClient();

  // Fetch linked vehicle details to verify rules
  const { data: vehicle, error: vErr } = await supabase
    .from("vehicles")
    .select("status, name")
    .eq("id", parsed.data.vehicle_id)
    .single();

  if (vErr || !vehicle) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "Vehicle not found." },
    };
  }

  // Business Rule: Rejects vehicles currently on trip
  if (vehicle.status === "on_trip") {
    return {
      success: false,
      error: {
        code: "VEHICLE_ON_TRIP",
        message: `Cannot send vehicle ${vehicle.name} to the shop: It is currently active on a trip.`,
      },
    };
  }

  // Set vehicle status to 'in_shop'
  const { error: vUpdateErr } = await supabase
    .from("vehicles")
    .update({ status: "in_shop" })
    .eq("id", parsed.data.vehicle_id);

  if (vUpdateErr) {
    return {
      success: false,
      error: { code: "MUTATION_ERROR", message: "Failed to update vehicle status to shop." },
    };
  }

  // Insert open maintenance record
  const { data: record, error: insertErr } = await supabase
    .from("maintenance")
    .insert({
      vehicle_id: parsed.data.vehicle_id,
      maintenance_type: parsed.data.maintenance_type,
      description: parsed.data.description ?? null,
      cost: parsed.data.cost,
      status: "open",
      opened_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertErr) {
    // Rollback vehicle status
    await supabase.from("vehicles").update({ status: vehicle.status }).eq("id", parsed.data.vehicle_id);
    return {
      success: false,
      error: { code: "INSERT_ERROR", message: insertErr.message },
    };
  }

  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
  return { success: true, data: record as Maintenance };
}

export async function closeMaintenanceRecord(
  recordId: string
): Promise<ActionResult<Maintenance>> {
  if (!recordId) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Record ID is required." },
    };
  }

  const supabase = await createClient();

  // Fetch record to check status and vehicle
  const { data: record, error: rErr } = await supabase
    .from("maintenance")
    .select("status, vehicle_id")
    .eq("id", recordId)
    .single();

  if (rErr || !record) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "Maintenance record not found." },
    };
  }

  if (record.status !== "open") {
    return {
      success: false,
      error: {
        code: "INVALID_STATUS",
        message: `Only open repair tickets can be closed. Current status: ${record.status}`,
      },
    };
  }

  // Update record status to 'closed'
  const { data: updatedRecord, error: rUpdateErr } = await supabase
    .from("maintenance")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
    })
    .eq("id", recordId)
    .select()
    .single();

  if (rUpdateErr) {
    return {
      success: false,
      error: { code: "MUTATION_ERROR", message: "Failed to close maintenance record." },
    };
  }

  // Restore vehicle status to available if not retired
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("status")
    .eq("id", record.vehicle_id)
    .single();

  if (vehicle && vehicle.status !== "retired") {
    await supabase
      .from("vehicles")
      .update({ status: "available" })
      .eq("id", record.vehicle_id);
  }

  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
  return { success: true, data: updatedRecord as Maintenance };
}
