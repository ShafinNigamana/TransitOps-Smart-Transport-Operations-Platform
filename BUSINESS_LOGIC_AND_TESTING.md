# TransitOps — Business Logic, Edge Cases & Testing Blueprint

This document is the execution checklist: the 10 mandatory rules as pseudocode, the failure modes that break naive implementations, the exact 9-step verification workflow from the official brief, and a minute-by-minute demo script.

---

## 1. Mandatory Business Rules — Pseudocode

Each rule below is written as TypeScript-style pseudocode matching the Server Actions in `SYSTEM_ARCHITECTURE.md §3`. All ten are enforced **inside the Server Action**, not just in the UI.

### Rule 1 — Vehicle Registration Uniqueness & Format Validation

```ts
function validateRegistrationNumber(regNumber: string): ValidationResult {
  const pattern = /^[A-Za-z0-9-]{2,20}$/;
  if (!pattern.test(regNumber)) {
    return { valid: false, error: "Registration number must be 2-20 letters, numbers, or hyphens." };
  }
  const existing = db.vehicles.findOne({ registration_number: regNumber });
  if (existing) {
    return { valid: false, error: `Registration number "${regNumber}" is already in use.` };
  }
  return { valid: true };
}
```
*Enforced by:* Zod regex (format) + a Postgres `UNIQUE` constraint (uniqueness) as the source of truth, so a race between two simultaneous creates still can't produce two rows with the same registration number — the second insert throws `23505` and the Server Action turns that into the same user-facing message.

### Rule 2 — Cargo Weight vs. Vehicle Max Capacity

```ts
function validateCargoWeight(cargoWeightKg: number, vehicle: Vehicle): ValidationResult {
  if (cargoWeightKg > vehicle.max_load_capacity_kg) {
    return {
      valid: false,
      error: `Cargo weight ${cargoWeightKg}kg exceeds ${vehicle.name}'s ${vehicle.max_load_capacity_kg}kg limit.`,
    };
  }
  return { valid: true };
}
```
*Enforced by:* `createTrip` re-fetches the vehicle server-side and checks this before insert — never trusts a client-computed "is valid" flag.

### Rule 3 — Exclusion of 'In Shop' and 'Retired' Vehicles from Dispatch

```ts
function getDispatchableVehicles(): Vehicle[] {
  // Only vehicles explicitly 'available' are ever offered — 'on_trip', 'in_shop',
  // and 'retired' are all excluded by the same single condition, so a new status
  // value added later is excluded by default unless explicitly allow-listed.
  return db.vehicles.find({ status: 'available' });
}
```
*Enforced by:* the query itself (`where status = 'available'`), used both to populate the trip-creation dropdown and again as a server-side re-check at dispatch time.

### Rule 4 — Exclusion of Drivers with Expired Licenses, 'Suspended', or 'Off Duty' Status

```ts
function getDispatchableDrivers(): Driver[] {
  const today = new Date();
  return db.drivers.find({
    status: 'available',
    license_expiry_date: { $gte: today },
  });
  // 'suspended' and 'off_duty' drivers fail the status='available' check;
  // an expired license fails the date check even if status is still 'available'
  // (e.g., nobody manually flagged them yet) — the date check is never skipped.
}
```
*Enforced by:* combining both conditions in one query, so an expired license excludes a driver even if a Safety Officer hasn't yet flipped their status manually.

### Rule 5 — Double-Booking Prevention

```ts
function assertNotDoubleBooked(vehicleId: string, driverId: string): ValidationResult {
  const vehicle = db.vehicles.findOne({ id: vehicleId });
  const driver = db.drivers.findOne({ id: driverId });

  if (vehicle.status === 'on_trip') {
    return { valid: false, error: "This vehicle is already assigned to an active trip." };
  }
  if (driver.status === 'on_trip') {
    return { valid: false, error: "This driver is already assigned to an active trip." };
  }
  return { valid: true };
}
```
*Enforced by:* re-checked inside `dispatchTrip` (not just `createTrip`), since time can pass between drafting a trip and dispatching it — see the concurrency edge case in §2.

### Rule 6 — Auto-Status Transition on Dispatch

```ts
async function dispatchTrip(tripId: string): Promise<ActionResult<Trip>> {
  return db.transaction(async (tx) => {
    const trip = await tx.trips.findOne({ id: tripId });
    if (trip.status !== 'draft') {
      return { success: false, error: { code: 'TRIP_NOT_DRAFT', message: 'Trip is not in draft status.' } };
    }

    const vehicle = await tx.vehicles.findOne({ id: trip.vehicle_id });
    const driver = await tx.drivers.findOne({ id: trip.driver_id });
    const doubleBooking = assertNotDoubleBooked(vehicle.id, driver.id);
    if (!doubleBooking.valid) {
      return { success: false, error: { code: 'ALREADY_BOOKED', message: doubleBooking.error } };
    }
    if (driver.license_expiry_date < new Date()) {
      return { success: false, error: { code: 'DRIVER_LICENSE_EXPIRED', message: 'Driver license has expired.' } };
    }

    await tx.trips.update({ id: tripId }, { status: 'dispatched', dispatched_at: now() });
    await tx.vehicles.update({ id: vehicle.id }, { status: 'on_trip' });
    await tx.drivers.update({ id: driver.id }, { status: 'on_trip' });

    return { success: true, data: await tx.trips.findOne({ id: tripId }) };
  });
}
```

### Rule 7 — Auto-Status Transition on Completion

```ts
async function completeTrip(tripId: string, actualDistanceKm: number, fuelConsumedL: number) {
  return db.transaction(async (tx) => {
    const trip = await tx.trips.findOne({ id: tripId });
    if (trip.status !== 'dispatched') {
      return { success: false, error: { code: 'TRIP_NOT_DISPATCHED', message: 'Trip is not currently dispatched.' } };
    }

    await tx.trips.update({ id: tripId }, {
      status: 'completed',
      completed_at: now(),
      actual_distance_km: actualDistanceKm,
      fuel_consumed_l: fuelConsumedL,
    });
    await tx.vehicles.update(
      { id: trip.vehicle_id },
      { status: 'available', odometer_km: raw(`odometer_km + ${actualDistanceKm}`) }
    );
    await tx.drivers.update({ id: trip.driver_id }, { status: 'available' });

    return { success: true, data: await tx.trips.findOne({ id: tripId }) };
  });
}
```

### Rule 8 — Auto-Status Transition on Cancellation

```ts
async function cancelTrip(tripId: string, reason?: string) {
  return db.transaction(async (tx) => {
    const trip = await tx.trips.findOne({ id: tripId });
    if (trip.status === 'completed' || trip.status === 'cancelled') {
      return { success: false, error: { code: 'TRIP_ALREADY_TERMINAL', message: 'Trip is already finalized.' } };
    }

    const wasDispatched = trip.status === 'dispatched';
    await tx.trips.update({ id: tripId }, { status: 'cancelled', cancelled_at: now() });

    if (wasDispatched) {
      await tx.vehicles.update({ id: trip.vehicle_id }, { status: 'available' });
      await tx.drivers.update({ id: trip.driver_id }, { status: 'available' });
    }
    // If it was still 'draft', vehicle/driver were never claimed, so nothing to restore.

    return { success: true, data: await tx.trips.findOne({ id: tripId }) };
  });
}
```

### Rule 9 — Auto-Status Transition on Maintenance Creation

```ts
async function createMaintenanceRecord(vehicleId: string, input: MaintenanceInput) {
  return db.transaction(async (tx) => {
    const vehicle = await tx.vehicles.findOne({ id: vehicleId });
    if (vehicle.status === 'on_trip') {
      return {
        success: false,
        error: { code: 'VEHICLE_ON_TRIP', message: "Cannot start maintenance while the vehicle is on a trip." },
      };
    }

    const record = await tx.maintenance.insert({
      vehicle_id: vehicleId,
      maintenance_type: input.maintenanceType,
      description: input.description,
      cost: input.cost,
      status: 'open',
    });
    await tx.vehicles.update({ id: vehicleId }, { status: 'in_shop' });

    return { success: true, data: record };
  });
}
```

### Rule 10 — Auto-Status Transition on Maintenance Closure

```ts
async function closeMaintenanceRecord(maintenanceId: string) {
  return db.transaction(async (tx) => {
    const record = await tx.maintenance.findOne({ id: maintenanceId });
    if (record.status === 'closed') {
      return { success: false, error: { code: 'ALREADY_CLOSED', message: 'This maintenance record is already closed.' } };
    }

    await tx.maintenance.update({ id: maintenanceId }, { status: 'closed', closed_at: now() });

    const vehicle = await tx.vehicles.findOne({ id: record.vehicle_id });
    if (vehicle.status !== 'retired') {
      await tx.vehicles.update({ id: vehicle.id }, { status: 'available' });
    }
    // Retired vehicles stay retired even after maintenance closes.

    return { success: true, data: record };
  });
}
```

---

## 2. Edge Cases & Failure Recovery

### 2.1 Concurrent Dispatch Requests
**Scenario:** Two dispatchers try to dispatch the same draft trip (or two different draft trips referencing the same vehicle) within milliseconds of each other.

**Handling:**
- `dispatchTrip` re-fetches the vehicle and driver **inside the transaction**, not from a value passed in from the client, and re-checks `status = 'available'` at that moment — not at draft-creation time.
- Wrap the read-then-write in a single Postgres transaction using `select ... for update` on the vehicle and driver rows, so the second concurrent transaction blocks until the first commits, then sees the now-`on_trip` status and fails cleanly with `VEHICLE_NO_LONGER_AVAILABLE` instead of both transactions succeeding and double-booking the vehicle.
- The UI surfaces this as: "This vehicle was just assigned to another trip. Please choose a different vehicle." — not a generic error, since this is a plausible real occurrence during the demo if two team members drive it simultaneously.

### 2.2 Missing Odometer Data
**Scenario:** A driver clicks "Complete Trip" but the odometer/fuel fields are empty or the vehicle's odometer was never set correctly at registration.

**Handling:**
- `actualDistanceKm` and `fuelConsumedL` are required fields on `completeTrip`'s Zod schema (`z.number().nonnegative()`, no `.optional()`) — the form cannot submit without them, and the Server Action rejects a missing value with `VALIDATION_ERROR` rather than silently writing `null` and corrupting the Fuel Efficiency calculation downstream.
- If a real odometer reading is genuinely unavailable in the field, the UI should still require **some** numeric value (even a manual estimate) rather than allowing `null` through, since `null` values would need to be filtered out of every aggregate query in Analytics — better to force a number at the point of entry than special-case `null` everywhere downstream.
- Fuel Efficiency and ROI formulas both already guard divide-by-zero (`totalFuelL <= 0 → null`), so a trip with `fuelConsumedL = 0` degrades gracefully to "No data" in the UI instead of crashing the report.

### 2.3 Negative Expense Values
**Scenario:** A Financial Analyst fat-fingers a negative number into the Amount field (e.g., trying to represent a refund/credit).

**Handling:**
- `amount: z.number().nonnegative()` on both `createExpense` and `createFuelLog` schemas rejects negative input at the Server Action boundary with the message "Amount cannot be negative."
- The `check (amount >= 0)` / `check (cost >= 0)` constraints on the `expenses` and `fuel_logs` tables are the second line of defense — even a bug in application code can't write a negative value to the database.
- If refunds/credits are a real need, model them as a separate `category = 'refund'` with a **positive** amount that's *subtracted* in the reporting query, rather than allowing negative amounts into a column that other formulas sum directly — this keeps every downstream `sum()` correct without special-casing sign.

### 2.4 Additional Edge Cases Worth Handling if Time Allows
- **Retiring a vehicle mid-trip:** disallow setting `status = 'retired'` directly while `status = 'on_trip'` — force completion/cancellation first, same guard as Rule 9's maintenance check.
- **Driver license expiring between draft and dispatch:** already covered by Rule 6's re-check at dispatch time (§1), not just at draft creation.
- **Deleting a vehicle/driver referenced by historical trips:** prevented structurally — `trips.vehicle_id`/`driver_id` use `on delete restrict`, so a hard delete fails loudly instead of silently orphaning trip history; retirement (soft delete via status) is the only supported removal path.

---

## 3. Step-by-Step Test Suite — The 9-Step Verification Workflow

This maps directly to the official brief's example workflow (Section 5) and should be run live, end-to-end, as the final pre-demo sanity check.

| Step | Action | Expected Result | Pass/Fail Signal |
|---|---|---|---|
| 1 | Register vehicle "Van-05", max capacity 500kg | Vehicle created with `status = 'available'`; appears in Vehicles table | Row visible, badge reads "Available" |
| 2 | Register driver "Alex" with a valid (non-expired) license | Driver created with `status = 'available'` | Row visible, badge reads "Available" |
| 3 | Create a trip with cargo weight = 450kg, Van-05 + Alex | Trip created with `status = 'draft'`; no validation error | Trip appears in Trips (Draft tab) |
| 4 | Attempt dispatch | System confirms 450kg ≤ 500kg and allows dispatch to proceed | No `CARGO_EXCEEDS_CAPACITY` error shown |
| 5 | Trip dispatches | Vehicle → `on_trip`, Driver → `on_trip`, Trip → `dispatched` | Both badges flip in real time; trip moves to Dispatched tab |
| 6 | Complete the trip, entering final odometer + fuel consumed | Trip → `completed`; vehicle odometer increments correctly | Trip moves to Completed tab; Vehicle detail shows updated odometer |
| 7 | Post-completion status check | Vehicle → `available`, Driver → `available` | Both badges read "Available" again |
| 8 | Create a maintenance record (e.g., "Oil Change") on Van-05 | Vehicle → `in_shop` automatically; Van-05 disappears from trip-creation dropdown | Open a new trip form — Van-05 is absent from the vehicle select |
| 9 | Check Reports & Analytics | Operational cost and fuel efficiency reflect the completed trip's fuel log and the new maintenance cost | Numbers on the Analytics page match a manual recompute from the seed data |

**Supplementary negative-path checks (not in the official 9 steps, but worth demonstrating deliberately during the video — see §4):**
- Attempt a trip with cargo weight > vehicle capacity → rejected with `CARGO_EXCEEDS_CAPACITY`.
- Attempt to select a `suspended` driver or an `in_shop` vehicle in the trip form → not present in the dropdown at all.
- Attempt to dispatch a vehicle/driver that's already `on_trip` (via a second draft trip referencing the same pair) → rejected with the double-booking error.
- Attempt to enter a negative expense amount → rejected with a validation message.

---

## 4. Demo Video Script & Walkthrough (5–7 Minutes)

**Goal:** prove the platform enforces every mandatory rule, not just that the UI looks nice. Every screen shown should map back to something in the brief.

**0:00 – 0:30 | Cold open — the problem**
Say the one-sentence version: logistics teams run fleets on spreadsheets, which causes double-bookings, missed maintenance, and no real cost visibility. Show a quick title card: "TransitOps — Smart Transport Operations Platform."

**0:30 – 1:15 | Architecture in 45 seconds**
Show the stack slide/diagram: Next.js 14 App Router + Server Actions, Supabase Postgres with RLS, Tailwind/shadcn UI. One sentence on why: "every business rule lives in the database and the server action layer, not just the frontend, so it can't be bypassed."

**1:15 – 2:45 | Happy path walkthrough (Steps 1–7 of the test suite)**
- Log in as Fleet Manager → register Van-05 (500kg capacity).
- Log in as Safety Officer (or same session if RBAC demo is later) → register driver Alex.
- Switch to Driver role → create a trip, 450kg cargo, Van-05 + Alex.
- Dispatch it live — narrate: "cargo check passes, vehicle and driver both flip to On Trip instantly."
- Complete it — enter odometer + fuel, narrate the automatic status reset to Available.

**2:45 – 4:15 | Breaking it on purpose — business rule demonstration**
This is the most important section for scoring — show validation actually rejecting bad input, not just working when everything is correct:
- Try to create a trip with cargo weight over capacity → show the inline rejection.
- Try to assign a suspended driver or an in-shop vehicle → show it's simply not selectable.
- Try to double-book a vehicle already On Trip → show the rejection message.
- Try a negative expense amount → show the validation error.

**4:15 – 5:15 | Maintenance workflow (Step 8)**
- Log in as Fleet Manager → open Maintenance, create a record for Van-05.
- Immediately open a new trip form and show Van-05 is gone from the dropdown — no manual step needed.
- Close the maintenance record, show Van-05 returns to Available.

**5:15 – 6:15 | Analytics & ROI (Step 9, Financial Analyst persona)**
- Switch to Financial Analyst → open Reports & Analytics.
- Point out Fuel Efficiency, Total Operational Cost, and Vehicle ROI for Van-05, all reflecting the trip and maintenance just performed.
- Show the Fleet Utilization KPI on the Dashboard updating.
- Click CSV export, briefly show the downloaded file.

**6:15 – 7:00 | Close**
- One sentence recap: "Every rule in the brief — capacity, licensing, double-booking, four automatic status transitions — is enforced server-side, and the analytics are computed live from that same data, not a separate spreadsheet."
- Mention what's next if more time existed: PDF export, license-expiry email reminders, document uploads (the bonus list) — framed as "deliberately deferred, not missed."
- End on the dashboard, dark mode toggled on, for a clean final frame.
