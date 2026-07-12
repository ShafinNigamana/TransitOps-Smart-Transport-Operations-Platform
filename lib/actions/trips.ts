"use server";

import { createClient } from "@/lib/supabase/server";
import { createTripSchema, completeTripSchema } from "@/lib/validations/trip.schema";
import type { ActionResult, Trip } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function createTrip(
  input: unknown
): Promise<ActionResult<Trip>> {
  const parsed = createTripSchema.safeParse(input);
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

  // Fetch linked vehicle details
  const { data: vehicle, error: vErr } = await supabase
    .from("vehicles")
    .select("max_load_capacity_kg, status")
    .eq("id", parsed.data.vehicle_id)
    .single();

  if (vErr || !vehicle) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "Assigned vehicle not found." },
    };
  }

  // Business Rule: Cargo weight limit check
  if (parsed.data.cargo_weight_kg > vehicle.max_load_capacity_kg) {
    return {
      success: false,
      error: {
        code: "OVERWEIGHT_CARGO",
        message: `Cargo weight (${parsed.data.cargo_weight_kg} kg) exceeds vehicle maximum capacity (${vehicle.max_load_capacity_kg} kg).`,
      },
    };
  }

  // Fetch linked driver details
  const { data: driver, error: dErr } = await supabase
    .from("drivers")
    .select("license_expiry_date, status")
    .eq("id", parsed.data.driver_id)
    .single();

  if (dErr || !driver) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "Assigned driver not found." },
    };
  }

  // Business Rule: Driver license validity check
  if (new Date(driver.license_expiry_date) < new Date()) {
    return {
      success: false,
      error: {
        code: "EXPIRED_LICENSE",
        message: `Driver's license is expired (Expiry date: ${driver.license_expiry_date}).`,
      },
    };
  }

  // Insert draft trip record
  const tripCountRes = await supabase.from("trips").select("id", { count: "exact", head: true });
  const count = tripCountRes.count ?? 0;
  const tripCode = `TRP-${1000 + count + 1}`;

  const { data: trip, error: insertErr } = await supabase
    .from("trips")
    .insert({
      trip_code: tripCode,
      source: parsed.data.source,
      destination: parsed.data.destination,
      cargo_weight_kg: parsed.data.cargo_weight_kg,
      planned_distance_km: parsed.data.planned_distance_km,
      vehicle_id: parsed.data.vehicle_id,
      driver_id: parsed.data.driver_id,
      status: "draft",
    })
    .select()
    .single();

  if (insertErr) {
    return {
      success: false,
      error: { code: "INSERT_ERROR", message: insertErr.message },
    };
  }

  revalidatePath("/trips");
  revalidatePath("/dashboard");
  return { success: true, data: trip as Trip };
}

export async function dispatchTrip(
  tripId: string
): Promise<ActionResult<Trip>> {
  if (!tripId) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Trip ID is required." },
    };
  }

  const supabase = await createClient();

  // Fetch trip state
  const { data: trip, error: tErr } = await supabase
    .from("trips")
    .select("status, vehicle_id, driver_id")
    .eq("id", tripId)
    .single();

  if (tErr || !trip) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "Trip record not found." },
    };
  }

  if (trip.status !== "draft") {
    return {
      success: false,
      error: {
        code: "INVALID_STATUS",
        message: `Only draft trips can be dispatched. Current status: ${trip.status}`,
      },
    };
  }

  // Check vehicle availability
  const { data: vehicle, error: vErr } = await supabase
    .from("vehicles")
    .select("status, name")
    .eq("id", trip.vehicle_id)
    .single();

  if (vErr || !vehicle) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "Assigned vehicle not found." },
    };
  }

  if (vehicle.status !== "available") {
    return {
      success: false,
      error: {
        code: "VEHICLE_UNAVAILABLE",
        message: `Vehicle ${vehicle.name} is currently ${vehicle.status}.`,
      },
    };
  }

  // Check driver availability & license
  const { data: driver, error: dErr } = await supabase
    .from("drivers")
    .select("status, full_name, license_expiry_date")
    .eq("id", trip.driver_id)
    .single();

  if (dErr || !driver) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "Assigned driver not found." },
    };
  }

  if (driver.status !== "available") {
    return {
      success: false,
      error: {
        code: "DRIVER_UNAVAILABLE",
        message: `Driver ${driver.full_name} is currently ${driver.status}.`,
      },
    };
  }

  if (new Date(driver.license_expiry_date) < new Date()) {
    return {
      success: false,
      error: {
        code: "EXPIRED_LICENSE",
        message: `Driver ${driver.full_name}'s license is expired.`,
      },
    };
  }

  // Dispatch atomic mutations sequentially
  const { error: vUpdateErr } = await supabase
    .from("vehicles")
    .update({ status: "on_trip" })
    .eq("id", trip.vehicle_id);

  if (vUpdateErr) {
    return {
      success: false,
      error: { code: "MUTATION_ERROR", message: "Failed to update vehicle status." },
    };
  }

  const { error: dUpdateErr } = await supabase
    .from("drivers")
    .update({ status: "on_trip" })
    .eq("id", trip.driver_id);

  if (dUpdateErr) {
    // Rollback vehicle update
    await supabase.from("vehicles").update({ status: "available" }).eq("id", trip.vehicle_id);
    return {
      success: false,
      error: { code: "MUTATION_ERROR", message: "Failed to update driver status." },
    };
  }

  const { data: updatedTrip, error: tUpdateErr } = await supabase
    .from("trips")
    .update({
      status: "dispatched",
      dispatched_at: new Date().toISOString(),
    })
    .eq("id", tripId)
    .select()
    .single();

  if (tUpdateErr) {
    // Rollback
    await supabase.from("vehicles").update({ status: "available" }).eq("id", trip.vehicle_id);
    await supabase.from("drivers").update({ status: "available" }).eq("id", trip.driver_id);
    return {
      success: false,
      error: { code: "MUTATION_ERROR", message: "Failed to dispatch trip." },
    };
  }

  revalidatePath("/trips");
  revalidatePath("/dashboard");
  return { success: true, data: updatedTrip as Trip };
}

export async function completeTrip(
  input: unknown
): Promise<ActionResult<Trip>> {
  const parsed = completeTripSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid metrics provided.",
      },
    };
  }

  const supabase = await createClient();

  // Fetch trip
  const { data: trip, error: tErr } = await supabase
    .from("trips")
    .select("status, vehicle_id, driver_id")
    .eq("id", parsed.data.trip_id)
    .single();

  if (tErr || !trip) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "Trip record not found." },
    };
  }

  if (trip.status !== "dispatched") {
    return {
      success: false,
      error: {
        code: "INVALID_STATUS",
        message: `Only active (dispatched) trips can be completed. Current status: ${trip.status}`,
      },
    };
  }

  // Fetch vehicle current odometer
  const { data: vehicle, error: vErr } = await supabase
    .from("vehicles")
    .select("odometer_km")
    .eq("id", trip.vehicle_id)
    .single();

  if (vErr || !vehicle) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "Assigned vehicle not found." },
    };
  }

  // Update vehicle: release status and increment odometer
  const newOdometer = vehicle.odometer_km + parsed.data.actual_distance_km;
  const { error: vUpdateErr } = await supabase
    .from("vehicles")
    .update({
      status: "available",
      odometer_km: newOdometer,
    })
    .eq("id", trip.vehicle_id);

  if (vUpdateErr) {
    return {
      success: false,
      error: { code: "MUTATION_ERROR", message: "Failed to update vehicle odometer." },
    };
  }

  // Update driver: release status
  const { error: dUpdateErr } = await supabase
    .from("drivers")
    .update({ status: "available" })
    .eq("id", trip.driver_id);

  if (dUpdateErr) {
    // Rollback vehicle update (best effort)
    await supabase
      .from("vehicles")
      .update({ status: "on_trip", odometer_km: vehicle.odometer_km })
      .eq("id", trip.vehicle_id);
    return {
      success: false,
      error: { code: "MUTATION_ERROR", message: "Failed to update driver status." },
    };
  }

  // Log fuel entry
  const fuelRate = 1.45; // Standard mock cost per liter
  const fuelCost = Math.round(parsed.data.fuel_consumed_l * fuelRate * 100) / 100;
  await supabase.from("fuel_logs").insert({
    vehicle_id: trip.vehicle_id,
    trip_id: parsed.data.trip_id,
    liters: parsed.data.fuel_consumed_l,
    cost: fuelCost,
    log_date: new Date().toISOString().split("T")[0],
  });

  // Update trip status to completed
  const { data: updatedTrip, error: tUpdateErr } = await supabase
    .from("trips")
    .update({
      status: "completed",
      actual_distance_km: parsed.data.actual_distance_km,
      fuel_consumed_l: parsed.data.fuel_consumed_l,
      completed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.trip_id)
    .select()
    .single();

  if (tUpdateErr) {
    // Rollback
    await supabase.from("vehicles").update({ status: "on_trip", odometer_km: vehicle.odometer_km }).eq("id", trip.vehicle_id);
    await supabase.from("drivers").update({ status: "on_trip" }).eq("id", trip.driver_id);
    return {
      success: false,
      error: { code: "MUTATION_ERROR", message: "Failed to complete trip." },
    };
  }

  revalidatePath("/trips");
  revalidatePath("/dashboard");
  return { success: true, data: updatedTrip as Trip };
}

export async function cancelTrip(
  tripId: string
): Promise<ActionResult<Trip>> {
  if (!tripId) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Trip ID is required." },
    };
  }

  const supabase = await createClient();

  const { data: trip, error: tErr } = await supabase
    .from("trips")
    .select("status, vehicle_id, driver_id")
    .eq("id", tripId)
    .single();

  if (tErr || !trip) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "Trip record not found." },
    };
  }

  if (trip.status === "completed" || trip.status === "cancelled") {
    return {
      success: false,
      error: {
        code: "INVALID_STATUS",
        message: `Cannot cancel a trip that is already ${trip.status}.`,
      },
    };
  }

  const wasDispatched = trip.status === "dispatched";

  if (wasDispatched) {
    // Free up vehicle and driver status
    await supabase.from("vehicles").update({ status: "available" }).eq("id", trip.vehicle_id);
    await supabase.from("drivers").update({ status: "available" }).eq("id", trip.driver_id);
  }

  const { data: updatedTrip, error: tUpdateErr } = await supabase
    .from("trips")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", tripId)
    .select()
    .single();

  if (tUpdateErr) {
    return {
      success: false,
      error: { code: "MUTATION_ERROR", message: "Failed to update trip cancellation status." },
    };
  }

  revalidatePath("/trips");
  revalidatePath("/dashboard");
  return { success: true, data: updatedTrip as Trip };
}
