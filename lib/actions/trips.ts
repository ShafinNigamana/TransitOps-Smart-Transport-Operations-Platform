"use server";

import { pool } from "@/lib/db";
import { createTripSchema, completeTripSchema } from "@/lib/validations/trip.schema";
import type { ActionResult, Trip } from "@/types/database";
import { revalidatePath } from "next/cache";
import { assertRole } from "@/lib/actions/auth";

export async function createTrip(
  input: unknown
): Promise<ActionResult<Trip>> {
  const auth = await assertRole(["driver"]);
  if (!auth.success) {
    return { success: false, error: auth.error };
  }

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

  try {
    const vehicleRes = await pool.query(
      "SELECT max_load_capacity_kg, status FROM public.vehicles WHERE id = $1",
      [parsed.data.vehicle_id]
    );

    if (vehicleRes.rows.length === 0) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Assigned vehicle not found." },
      };
    }

    const vehicle = vehicleRes.rows[0];

    if (parsed.data.cargo_weight_kg > vehicle.max_load_capacity_kg) {
      return {
        success: false,
        error: {
          code: "OVERWEIGHT_CARGO",
          message: `Cargo weight (${parsed.data.cargo_weight_kg} kg) exceeds vehicle maximum capacity (${vehicle.max_load_capacity_kg} kg).`,
        },
      };
    }

    const driverRes = await pool.query(
      "SELECT license_expiry_date, status FROM public.drivers WHERE id = $1",
      [parsed.data.driver_id]
    );

    if (driverRes.rows.length === 0) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Assigned driver not found." },
      };
    }

    const driver = driverRes.rows[0];

    if (new Date(driver.license_expiry_date) < new Date()) {
      return {
        success: false,
        error: {
          code: "EXPIRED_LICENSE",
          message: `Driver's license is expired (Expiry date: ${driver.license_expiry_date}).`,
        },
      };
    }

    const tripCountRes = await pool.query("SELECT count(*) as count FROM public.trips");
    const count = parseInt(tripCountRes.rows[0].count) || 0;
    const tripCode = `TRP-${1000 + count + 1}`;

    const insertRes = await pool.query(
      `INSERT INTO public.trips 
        (trip_code, source, destination, cargo_weight_kg, planned_distance_km, vehicle_id, driver_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
       RETURNING *`,
      [
        tripCode,
        parsed.data.source,
        parsed.data.destination,
        parsed.data.cargo_weight_kg,
        parsed.data.planned_distance_km,
        parsed.data.vehicle_id,
        parsed.data.driver_id,
      ]
    );

    revalidatePath("/trips");
    revalidatePath("/dashboard");
    return { success: true, data: insertRes.rows[0] as Trip };
  } catch (error: any) {
    return {
      success: false,
      error: { code: "INSERT_ERROR", message: error.message || "Failed to create trip." },
    };
  }
}

export async function dispatchTrip(
  tripId: string
): Promise<ActionResult<Trip>> {
  const auth = await assertRole(["driver", "fleet_manager"]);
  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  if (!tripId) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Trip ID is required." },
    };
  }

  try {
    const tripRes = await pool.query(
      "SELECT status, vehicle_id, driver_id FROM public.trips WHERE id = $1",
      [tripId]
    );

    if (tripRes.rows.length === 0) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Trip record not found." },
      };
    }

    const trip = tripRes.rows[0];

    if (trip.status !== "draft") {
      return {
        success: false,
        error: {
          code: "INVALID_STATUS",
          message: `Only draft trips can be dispatched. Current status: ${trip.status}`,
        },
      };
    }

    const vehicleRes = await pool.query(
      "SELECT status, name FROM public.vehicles WHERE id = $1",
      [trip.vehicle_id]
    );

    if (vehicleRes.rows.length === 0) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Assigned vehicle not found." },
      };
    }

    const vehicle = vehicleRes.rows[0];

    if (vehicle.status !== "available") {
      return {
        success: false,
        error: {
          code: "VEHICLE_UNAVAILABLE",
          message: `Vehicle ${vehicle.name} is currently ${vehicle.status}.`,
        },
      };
    }

    const driverRes = await pool.query(
      "SELECT status, full_name, license_expiry_date FROM public.drivers WHERE id = $1",
      [trip.driver_id]
    );

    if (driverRes.rows.length === 0) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Assigned driver not found." },
      };
    }

    const driver = driverRes.rows[0];

    if (driver.status !== "available") {
      return {
        success: false,
        error: {
          code: "DRIVER_UNAVAILABLE",
          message: `Driver ${driver.full_name} is currently ${driver.status}.`,
        },
      };
    }

    const thirtyDaysLimit = new Date();
    thirtyDaysLimit.setDate(thirtyDaysLimit.getDate() + 30);
    thirtyDaysLimit.setHours(0, 0, 0, 0);

    const expiryDate = new Date(driver.license_expiry_date);
    expiryDate.setHours(0, 0, 0, 0);

    if (expiryDate < thirtyDaysLimit) {
      return {
        success: false,
        error: {
          code: "EXPIRED_LICENSE",
          message: expiryDate < new Date()
            ? `Driver ${driver.full_name}'s license is expired.`
            : `Driver ${driver.full_name}'s license expires within 30 days.`,
        },
      };
    }

    await pool.query("UPDATE public.vehicles SET status = 'on_trip' WHERE id = $1", [trip.vehicle_id]);

    try {
      await pool.query("UPDATE public.drivers SET status = 'on_trip' WHERE id = $1", [trip.driver_id]);
    } catch (dErr) {
      await pool.query("UPDATE public.vehicles SET status = 'available' WHERE id = $1", [trip.vehicle_id]);
      throw dErr;
    }

    try {
      const updateRes = await pool.query(
        "UPDATE public.trips SET status = 'dispatched', dispatched_at = $1 WHERE id = $2 RETURNING *",
        [new Date().toISOString(), tripId]
      );

      revalidatePath("/trips");
      revalidatePath("/dashboard");
      return { success: true, data: updateRes.rows[0] as Trip };
    } catch (tErr) {
      await pool.query("UPDATE public.vehicles SET status = 'available' WHERE id = $1", [trip.vehicle_id]);
      await pool.query("UPDATE public.drivers SET status = 'available' WHERE id = $1", [trip.driver_id]);
      throw tErr;
    }

  } catch (error: any) {
    return {
      success: false,
      error: { code: "MUTATION_ERROR", message: error.message || "Failed to dispatch trip." },
    };
  }
}

export async function completeTrip(
  input: unknown
): Promise<ActionResult<Trip>> {
  const auth = await assertRole(["driver"]);
  if (!auth.success) {
    return { success: false, error: auth.error };
  }

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

  try {
    const tripRes = await pool.query(
      "SELECT status, vehicle_id, driver_id FROM public.trips WHERE id = $1",
      [parsed.data.trip_id]
    );

    if (tripRes.rows.length === 0) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Trip record not found." },
      };
    }

    const trip = tripRes.rows[0];

    if (trip.status !== "dispatched") {
      return {
        success: false,
        error: {
          code: "INVALID_STATUS",
          message: `Only active (dispatched) trips can be completed. Current status: ${trip.status}`,
        },
      };
    }

    const vehicleRes = await pool.query(
      "SELECT odometer_km FROM public.vehicles WHERE id = $1",
      [trip.vehicle_id]
    );

    if (vehicleRes.rows.length === 0) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Assigned vehicle not found." },
      };
    }

    const vehicle = vehicleRes.rows[0];
    const newOdometer = Number(vehicle.odometer_km) + parsed.data.actual_distance_km;

    await pool.query(
      "UPDATE public.vehicles SET status = 'available', odometer_km = $1 WHERE id = $2",
      [newOdometer, trip.vehicle_id]
    );

    try {
      await pool.query(
        "UPDATE public.drivers SET status = 'available' WHERE id = $1",
        [trip.driver_id]
      );
    } catch (dErr) {
      await pool.query(
        "UPDATE public.vehicles SET status = 'on_trip', odometer_km = $1 WHERE id = $2",
        [vehicle.odometer_km, trip.vehicle_id]
      );
      throw dErr;
    }

    // Insert Fuel Log
    const fuelRate = 1.45;
    const fuelCost = Math.round(parsed.data.fuel_consumed_l * fuelRate * 100) / 100;
    await pool.query(
      `INSERT INTO public.fuel_logs (vehicle_id, trip_id, liters, cost, log_date) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        trip.vehicle_id,
        parsed.data.trip_id,
        parsed.data.fuel_consumed_l,
        fuelCost,
        new Date().toISOString().split("T")[0],
      ]
    );

    const updateRes = await pool.query(
      `UPDATE public.trips 
       SET status = 'completed', 
           actual_distance_km = $1, 
           fuel_consumed_l = $2, 
           completed_at = $3 
       WHERE id = $4 
       RETURNING *`,
      [
        parsed.data.actual_distance_km,
        parsed.data.fuel_consumed_l,
        new Date().toISOString(),
        parsed.data.trip_id,
      ]
    );

    revalidatePath("/trips");
    revalidatePath("/dashboard");
    return { success: true, data: updateRes.rows[0] as Trip };
  } catch (error: any) {
    return {
      success: false,
      error: { code: "MUTATION_ERROR", message: error.message || "Failed to complete trip." },
    };
  }
}

export async function cancelTrip(
  tripId: string
): Promise<ActionResult<Trip>> {
  const auth = await assertRole(["driver", "fleet_manager"]);
  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  if (!tripId) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Trip ID is required." },
    };
  }

  try {
    const tripRes = await pool.query(
      "SELECT status, vehicle_id, driver_id FROM public.trips WHERE id = $1",
      [tripId]
    );

    if (tripRes.rows.length === 0) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Trip record not found." },
      };
    }

    const trip = tripRes.rows[0];

    if (trip.status === "completed" || trip.status === "cancelled") {
      return {
        success: false,
        error: {
          code: "INVALID_STATUS",
          message: `Cannot cancel a trip that is already ${trip.status}.`,
        },
      };
    }

    if (trip.status === "dispatched") {
      await pool.query("UPDATE public.vehicles SET status = 'available' WHERE id = $1", [trip.vehicle_id]);
      await pool.query("UPDATE public.drivers SET status = 'available' WHERE id = $1", [trip.driver_id]);
    }

    const updateRes = await pool.query(
      "UPDATE public.trips SET status = 'cancelled', cancelled_at = $1 WHERE id = $2 RETURNING *",
      [new Date().toISOString(), tripId]
    );

    revalidatePath("/trips");
    revalidatePath("/dashboard");
    return { success: true, data: updateRes.rows[0] as Trip };
  } catch (error: any) {
    return {
      success: false,
      error: { code: "MUTATION_ERROR", message: error.message || "Failed to cancel trip." },
    };
  }
}
