# TransitOps — System Architecture & Technical Specification

**Stack:** Next.js 14+ (App Router, TypeScript, Server Actions) · Supabase (PostgreSQL, Auth, RLS, Realtime) · Zod · Tailwind + shadcn/ui + Recharts/Tremor

---

## 1. Database Schema (Executable SQL)

Run this as a single Supabase migration. Order matters: extensions → enums → helper function → tables → indexes → RLS.

### 1.1 Extensions

```sql
create extension if not exists "pgcrypto"; -- for gen_random_uuid()
```

### 1.2 Enums

```sql
create type user_role as enum ('fleet_manager', 'driver', 'safety_officer', 'financial_analyst');
create type vehicle_status as enum ('available', 'on_trip', 'in_shop', 'retired');
create type driver_status as enum ('available', 'on_trip', 'off_duty', 'suspended');
create type trip_status as enum ('draft', 'dispatched', 'completed', 'cancelled');
create type maintenance_status as enum ('open', 'closed');
```

### 1.3 `profiles` (extends `auth.users` — carries RBAC role)

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'driver',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on profiles(role);
```

### 1.4 `vehicles`

```sql
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  registration_number text not null unique,
  name text not null,
  vehicle_type text not null,
  max_load_capacity_kg numeric(10,2) not null check (max_load_capacity_kg > 0),
  odometer_km numeric(12,2) not null default 0 check (odometer_km >= 0),
  acquisition_cost numeric(14,2) not null check (acquisition_cost >= 0),
  region text,
  status vehicle_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint registration_number_format check (registration_number ~ '^[A-Za-z0-9-]{2,20}$')
);

create index idx_vehicles_status on vehicles(status);
create index idx_vehicles_type on vehicles(vehicle_type);
create index idx_vehicles_region on vehicles(region);
```

### 1.5 `drivers`

```sql
create table drivers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  license_number text not null unique,
  license_category text not null,
  license_expiry_date date not null,
  contact_number text not null,
  safety_score numeric(5,2) not null default 100 check (safety_score between 0 and 100),
  status driver_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_drivers_status on drivers(status);
create index idx_drivers_license_expiry on drivers(license_expiry_date);
```

### 1.6 `trips`

```sql
create table trips (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  destination text not null,
  vehicle_id uuid not null references vehicles(id) on delete restrict,
  driver_id uuid not null references drivers(id) on delete restrict,
  cargo_weight_kg numeric(10,2) not null check (cargo_weight_kg > 0),
  planned_distance_km numeric(10,2) not null check (planned_distance_km > 0),
  actual_distance_km numeric(10,2) check (actual_distance_km >= 0),
  fuel_consumed_l numeric(10,2) check (fuel_consumed_l >= 0),
  status trip_status not null default 'draft',
  dispatched_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_trips_status on trips(status);
create index idx_trips_vehicle on trips(vehicle_id);
create index idx_trips_driver on trips(driver_id);
create index idx_trips_created_at on trips(created_at);
```

### 1.7 `maintenance`

```sql
create table maintenance (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  maintenance_type text not null,
  description text,
  cost numeric(12,2) not null default 0 check (cost >= 0),
  status maintenance_status not null default 'open',
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint closed_at_after_opened check (closed_at is null or closed_at >= opened_at)
);

create index idx_maintenance_vehicle on maintenance(vehicle_id);
create index idx_maintenance_status on maintenance(status);
```

### 1.8 `fuel_logs`

```sql
create table fuel_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  trip_id uuid references trips(id) on delete set null,
  liters numeric(10,2) not null check (liters > 0),
  cost numeric(12,2) not null check (cost >= 0),
  log_date date not null default current_date,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_fuel_logs_vehicle on fuel_logs(vehicle_id);
create index idx_fuel_logs_date on fuel_logs(log_date);
```

### 1.9 `expenses`

```sql
create table expenses (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) on delete cascade,
  trip_id uuid references trips(id) on delete set null,
  category text not null, -- e.g. 'toll', 'fine', 'parking', 'misc'
  amount numeric(12,2) not null check (amount >= 0),
  expense_date date not null default current_date,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_expenses_vehicle on expenses(vehicle_id);
create index idx_expenses_date on expenses(expense_date);
```

### 1.10 `updated_at` Trigger (applies to all mutable tables)

```sql
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_vehicles_updated_at before update on vehicles
  for each row execute function set_updated_at();
create trigger trg_drivers_updated_at before update on drivers
  for each row execute function set_updated_at();
create trigger trg_trips_updated_at before update on trips
  for each row execute function set_updated_at();
create trigger trg_maintenance_updated_at before update on maintenance
  for each row execute function set_updated_at();
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
```

### 1.11 Row Level Security

```sql
alter table profiles enable row level security;
alter table vehicles enable row level security;
alter table drivers enable row level security;
alter table trips enable row level security;
alter table maintenance enable row level security;
alter table fuel_logs enable row level security;
alter table expenses enable row level security;

-- Helper: current user's role, without recursive RLS lookups (SECURITY DEFINER)
create or replace function auth_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

-- profiles: everyone can read their own row; only they (or a fleet_manager, for admin) can update it
create policy profiles_select_own on profiles for select
  using (id = auth.uid() or auth_role() = 'fleet_manager');
create policy profiles_update_own on profiles for update
  using (id = auth.uid());

-- vehicles: all authenticated roles can read; only fleet_manager can write
create policy vehicles_select_all on vehicles for select
  using (auth.role() = 'authenticated');
create policy vehicles_write_fleet_manager on vehicles for insert
  with check (auth_role() = 'fleet_manager');
create policy vehicles_update_fleet_manager on vehicles for update
  using (auth_role() = 'fleet_manager');

-- drivers: all authenticated roles can read; fleet_manager can create, safety_officer can create/update/delete
create policy drivers_select_all on drivers for select
  using (auth.role() = 'authenticated');
create policy drivers_write_fleet_manager_or_safety on drivers for insert
  with check (auth_role() in ('fleet_manager', 'safety_officer'));
create policy drivers_update_fleet_manager_or_safety on drivers for update
  using (auth_role() in ('fleet_manager', 'safety_officer'));
create policy drivers_delete_safety_officer on drivers for delete
  using (auth_role() = 'safety_officer');

-- trips: all authenticated roles can read; driver role creates/updates (dispatch/complete/cancel)
create policy trips_select_all on trips for select
  using (auth.role() = 'authenticated');
create policy trips_write_driver on trips for insert
  with check (auth_role() = 'driver');
create policy trips_update_driver_or_fleet_manager on trips for update
  using (auth_role() in ('driver', 'fleet_manager'));

-- maintenance: all authenticated roles can read; only fleet_manager writes
create policy maintenance_select_all on maintenance for select
  using (auth.role() = 'authenticated');
create policy maintenance_write_fleet_manager on maintenance for insert
  with check (auth_role() = 'fleet_manager');
create policy maintenance_update_fleet_manager on maintenance for update
  using (auth_role() = 'fleet_manager');
create policy maintenance_delete_fleet_manager on maintenance for delete
  using (auth_role() = 'fleet_manager');

-- fuel_logs: financial_analyst full CRUD, driver can create/read, others read-only
create policy fuel_logs_select_all on fuel_logs for select
  using (auth.role() = 'authenticated');
create policy fuel_logs_write on fuel_logs for insert
  with check (auth_role() in ('financial_analyst', 'driver'));
create policy fuel_logs_update_financial on fuel_logs for update
  using (auth_role() = 'financial_analyst');
create policy fuel_logs_delete_financial on fuel_logs for delete
  using (auth_role() = 'financial_analyst');

-- expenses: same pattern as fuel_logs
create policy expenses_select_all on expenses for select
  using (auth.role() = 'authenticated');
create policy expenses_write on expenses for insert
  with check (auth_role() in ('financial_analyst', 'driver'));
create policy expenses_update_financial on expenses for update
  using (auth_role() = 'financial_analyst');
create policy expenses_delete_financial on expenses for delete
  using (auth_role() = 'financial_analyst');
```

> **Note on enforcement strategy:** RLS above is the *second* line of defense. The *first* line — and the one that actually produces good error messages during a demo — is validation inside each Server Action (Section 3). RLS exists so that even a bug in Server Action logic, or a direct API call, can't bypass RBAC.

---

## 2. Next.js App Router Folder & Component Architecture

### 2.1 Directory Map

```
transitops/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx                 # centered auth layout, no sidebar
│   ├── (app)/
│   │   ├── layout.tsx                 # sidebar + topnav + theme provider, requires session
│   │   ├── dashboard/
│   │   │   └── page.tsx               # KPIs + realtime active trips feed
│   │   ├── vehicles/
│   │   │   ├── page.tsx               # datatable + "New Vehicle" modal trigger
│   │   │   └── [id]/
│   │   │       └── page.tsx           # vehicle detail: trips, maintenance, fuel history
│   │   ├── drivers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── trips/
│   │   │   ├── page.tsx               # datatable filtered by status tabs (Draft/Dispatched/Completed/Cancelled)
│   │   │   └── [id]/
│   │   │       └── page.tsx           # trip detail + dispatch/complete/cancel actions
│   │   ├── maintenance/
│   │   │   └── page.tsx
│   │   ├── fuel-logs/
│   │   │   └── page.tsx
│   │   ├── expenses/
│   │   │   └── page.tsx
│   │   └── analytics/
│   │       └── page.tsx               # Fuel Efficiency, Op Cost, ROI, Utilization + CSV export
│   ├── layout.tsx                     # root html/body, font, ThemeProvider wrapper
│   └── globals.css
├── components/
│   ├── ui/                            # shadcn/ui primitives (button, dialog, table, badge, etc.)
│   ├── shared/
│   │   ├── status-badge.tsx           # maps any status enum -> colored Badge
│   │   ├── data-table.tsx             # generic TanStack-powered table w/ filter slot
│   │   ├── modal-form.tsx             # Dialog wrapper for create/edit forms
│   │   ├── kpi-card.tsx               # dashboard KPI tile
│   │   └── theme-toggle.tsx
│   ├── vehicles/
│   │   ├── vehicle-form.tsx
│   │   └── vehicle-columns.tsx        # TanStack column defs
│   ├── drivers/
│   │   ├── driver-form.tsx
│   │   └── driver-columns.tsx
│   ├── trips/
│   │   ├── trip-form.tsx
│   │   ├── trip-columns.tsx
│   │   └── trip-actions.tsx           # dispatch/complete/cancel buttons w/ confirm dialogs
│   ├── maintenance/
│   │   ├── maintenance-form.tsx
│   │   └── maintenance-columns.tsx
│   └── analytics/
│       ├── fleet-utilization-chart.tsx
│       ├── fuel-efficiency-chart.tsx
│       └── roi-table.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # browser client (createBrowserClient)
│   │   ├── server.ts                  # server client (createServerClient, cookies)
│   │   └── middleware.ts              # session refresh helper used by middleware.ts
│   ├── actions/
│   │   ├── vehicles.ts                # createVehicle, updateVehicle, retireVehicle
│   │   ├── drivers.ts                 # createDriver, updateDriver, suspendDriver
│   │   ├── trips.ts                   # createTrip, dispatchTrip, completeTrip, cancelTrip
│   │   ├── maintenance.ts             # createMaintenanceRecord, closeMaintenanceRecord
│   │   ├── fuel-and-expenses.ts       # createFuelLog, createExpense
│   │   └── analytics.ts               # getFleetKPIs, getVehicleROI, getFuelEfficiencyReport, exportFleetCSV
│   ├── validations/
│   │   ├── vehicle.schema.ts
│   │   ├── driver.schema.ts
│   │   ├── trip.schema.ts
│   │   ├── maintenance.schema.ts
│   │   └── fuel-expense.schema.ts
│   └── utils.ts                       # cn(), formatCurrency(), formatDate()
├── types/
│   └── database.ts                    # generated/handwritten Supabase row types
├── middleware.ts                      # protects (app) routes, redirects unauthenticated -> /login
├── tailwind.config.ts
└── package.json
```

### 2.2 Component Hierarchy & State Management Flow

- **Server Components by default.** Every `page.tsx` under `(app)/` is a Server Component that fetches its own data directly via the Supabase server client — no client-side `useEffect` fetching for initial page data.
- **Client Components only where interaction requires it:** modal forms, dropdowns with dependent filtering (e.g., trip form's vehicle/driver selects), the theme toggle, and any Recharts/Tremor chart component (charting libraries need the DOM).
- **Mutations flow through Server Actions, not API routes.** A form's `onSubmit` calls a Server Action directly (`'use server'` functions imported from `lib/actions/*`); the action validates with Zod, hits Supabase, and calls `revalidatePath()` on the relevant list route so the Server Component re-fetches fresh data. This avoids a separate client-side cache/state library entirely — Next.js's own cache invalidation is the state management layer.
- **Realtime is additive, not load-bearing.** The Dashboard's "Active Trips" widget subscribes to Supabase Realtime on the `trips` table (client component) purely so the KPI updates live during the demo without a manual refresh; if Realtime is skipped due to time, `revalidatePath` + normal navigation still keeps everything correct.
- **Theme state** lives in a cookie-backed `ThemeProvider` (client) wrapping the root layout, so dark mode preference survives reloads and is available on first server render (no flash).

---

## 3. API Routes & Server Actions Specification

All actions live under `lib/actions/*.ts` with `'use server'` at the top of the file. Every action returns:

```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };
```

### 3.1 `createVehicle`

- **Payload:**
```ts
type CreateVehicleInput = {
  registrationNumber: string;
  name: string;
  vehicleType: string;
  maxLoadCapacityKg: number;
  odometerKm: number;
  acquisitionCost: number;
  region?: string;
};
```
- **Zod Schema:**
```ts
export const createVehicleSchema = z.object({
  registrationNumber: z.string().regex(/^[A-Za-z0-9-]{2,20}$/, "Use 2-20 letters, numbers, or hyphens"),
  name: z.string().min(1, "Vehicle name is required"),
  vehicleType: z.string().min(1, "Vehicle type is required"),
  maxLoadCapacityKg: z.number().positive("Capacity must be greater than 0"),
  odometerKm: z.number().nonnegative("Odometer cannot be negative"),
  acquisitionCost: z.number().nonnegative("Acquisition cost cannot be negative"),
  region: z.string().optional(),
});
```
- **Supabase Query:** `insert into vehicles (...) values (...) returning *`, wrapped so a `unique_violation` on `registration_number` is caught explicitly.
- **Response:** `ActionResult<Vehicle>`.
- **Error Handling:** `DUPLICATE_REGISTRATION` (23505 on `registration_number`) → "A vehicle with this registration number already exists."; `VALIDATION_ERROR` → field-level Zod messages; `UNKNOWN` → generic toast + server log.

### 3.2 `createDriver`

- **Payload:** `{ fullName: string; licenseNumber: string; licenseCategory: string; licenseExpiryDate: string; contactNumber: string; safetyScore?: number }`
- **Zod Schema:**
```ts
export const createDriverSchema = z.object({
  fullName: z.string().min(1),
  licenseNumber: z.string().min(1),
  licenseCategory: z.string().min(1),
  licenseExpiryDate: z.coerce.date().refine((d) => d > new Date(), "License is already expired"),
  contactNumber: z.string().min(7),
  safetyScore: z.number().min(0).max(100).default(100),
});
```
- **Supabase Query:** `insert into drivers (...) returning *`; unique violation on `license_number` caught explicitly.
- **Response:** `ActionResult<Driver>`.
- **Error Handling:** `DUPLICATE_LICENSE`, `VALIDATION_ERROR`, `UNKNOWN` as above.

### 3.3 `createTrip` (creates in `draft` status)

- **Payload:** `{ source: string; destination: string; vehicleId: string; driverId: string; cargoWeightKg: number; plannedDistanceKm: number }`
- **Zod Schema:**
```ts
export const createTripSchema = z.object({
  source: z.string().min(1),
  destination: z.string().min(1),
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  cargoWeightKg: z.number().positive(),
  plannedDistanceKm: z.number().positive(),
});
```
- **Supabase Query / Logic:**
  1. Fetch the vehicle; confirm `status = 'available'` and `cargoWeightKg <= vehicle.max_load_capacity_kg`.
  2. Fetch the driver; confirm `status = 'available'` and `license_expiry_date >= current_date`.
  3. Insert trip row with `status = 'draft'`.
- **Response:** `ActionResult<Trip>`.
- **Error Handling:** `VEHICLE_UNAVAILABLE`, `DRIVER_UNAVAILABLE`, `DRIVER_LICENSE_EXPIRED`, `CARGO_EXCEEDS_CAPACITY` (message includes both numbers, e.g. "550 kg exceeds this vehicle's 500 kg limit"), `VALIDATION_ERROR`.

### 3.4 `dispatchTrip`

- **Payload:** `{ tripId: string }`
- **Zod Schema:** `z.object({ tripId: z.string().uuid() })`
- **Supabase Query / Logic (single transaction):**
  1. Re-fetch trip; must be `status = 'draft'`.
  2. Re-fetch vehicle and driver by ID; both must still be `available` (guards against a race where either was claimed by another trip since the draft was created — see `BUSINESS_LOGIC_AND_TESTING.md §2` on concurrency).
  3. Re-check license expiry (guards against a draft sitting open across a license's expiry date).
  4. Update trip → `dispatched`, `dispatched_at = now()`.
  5. Update vehicle → `on_trip`.
  6. Update driver → `on_trip`.
- **Response:** `ActionResult<Trip>`.
- **Error Handling:** `TRIP_NOT_DRAFT`, `VEHICLE_NO_LONGER_AVAILABLE`, `DRIVER_NO_LONGER_AVAILABLE`, `DRIVER_LICENSE_EXPIRED`.

### 3.5 `completeTrip`

- **Payload:** `{ tripId: string; actualDistanceKm: number; fuelConsumedL: number }`
- **Zod Schema:**
```ts
export const completeTripSchema = z.object({
  tripId: z.string().uuid(),
  actualDistanceKm: z.number().nonnegative(),
  fuelConsumedL: z.number().nonnegative(),
});
```
- **Supabase Query / Logic (single transaction):**
  1. Re-fetch trip; must be `status = 'dispatched'`.
  2. Update trip → `completed`, `completed_at = now()`, store `actual_distance_km`, `fuel_consumed_l`.
  3. Update vehicle → `available`, `odometer_km = odometer_km + actual_distance_km`.
  4. Update driver → `available`.
- **Response:** `ActionResult<Trip>`.
- **Error Handling:** `TRIP_NOT_DISPATCHED`, `VALIDATION_ERROR` (e.g. missing odometer/fuel — see edge case handling in Doc 3).

### 3.6 `cancelTrip`

- **Payload:** `{ tripId: string; reason?: string }`
- **Supabase Query / Logic:**
  1. Trip must be `status = 'dispatched'` (or `'draft'`, if cancelling before dispatch — no status restoration needed in that case since vehicle/driver were never claimed).
  2. Update trip → `cancelled`, `cancelled_at = now()`.
  3. If it was `dispatched`: restore vehicle → `available`, driver → `available`.
- **Response:** `ActionResult<Trip>`.
- **Error Handling:** `TRIP_ALREADY_TERMINAL` (already completed/cancelled).

### 3.7 `createMaintenanceRecord`

- **Payload:** `{ vehicleId: string; maintenanceType: string; description?: string; cost: number }`
- **Zod Schema:**
```ts
export const createMaintenanceSchema = z.object({
  vehicleId: z.string().uuid(),
  maintenanceType: z.string().min(1),
  description: z.string().optional(),
  cost: z.number().nonnegative(),
});
```
- **Supabase Query / Logic (single transaction):**
  1. Insert maintenance row with `status = 'open'`.
  2. Update vehicle → `in_shop` (regardless of prior status, except this action is disallowed if the vehicle is currently `on_trip` — see error below).
- **Response:** `ActionResult<Maintenance>`.
- **Error Handling:** `VEHICLE_ON_TRIP` ("Cannot start maintenance on a vehicle that's currently on a trip — wait for it to complete or cancel the trip first."), `VALIDATION_ERROR`.

### 3.8 `closeMaintenanceRecord`

- **Payload:** `{ maintenanceId: string }`
- **Supabase Query / Logic:**
  1. Maintenance must be `status = 'open'`.
  2. Update maintenance → `closed`, `closed_at = now()`.
  3. Fetch linked vehicle: if its status is `retired`, leave it `retired`; otherwise set it to `available`.
- **Response:** `ActionResult<Maintenance>`.
- **Error Handling:** `MAINTENANCE_ALREADY_CLOSED`.

### 3.9 `createFuelLog`

- **Payload:** `{ vehicleId: string; tripId?: string; liters: number; cost: number; logDate: string }`
- **Zod Schema:** `liters: z.number().positive()`, `cost: z.number().nonnegative()`, `logDate: z.coerce.date()`.
- **Response:** `ActionResult<FuelLog>`.
- **Error Handling:** `VALIDATION_ERROR` only — no cross-entity business rule blocks a fuel log.

### 3.10 `createExpense`

- **Payload:** `{ vehicleId?: string; tripId?: string; category: string; amount: number; expenseDate: string; notes?: string }`
- **Zod Schema:** `amount: z.number().nonnegative("Expense amount cannot be negative")` — this is the explicit guard for the "negative expense values" edge case.
- **Response:** `ActionResult<Expense>`.

### 3.11 `getFleetKPIs`

- **Payload:** none (or optional `{ region?: string }` filter).
- **Supabase Query:**
```sql
select
  count(*) filter (where status = 'available') as available_vehicles,
  count(*) filter (where status = 'on_trip') as active_vehicles,
  count(*) filter (where status = 'in_shop') as vehicles_in_maintenance,
  count(*) filter (where status <> 'retired') as total_non_retired_vehicles
from vehicles
where (:region is null or region = :region);

select
  count(*) filter (where status = 'dispatched') as active_trips,
  count(*) filter (where status = 'draft') as pending_trips
from trips;

select count(*) filter (where status = 'on_trip') as drivers_on_duty
from drivers;
```
- **Response shape:**
```ts
type FleetKPIs = {
  activeVehicles: number;
  availableVehicles: number;
  vehiclesInMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilizationPct: number; // computed per formula in §4.4
};
```

### 3.12 `getVehicleROI`, `getFuelEfficiencyReport`, `exportFleetCSV`

- **`getVehicleROI(vehicleId, dateRange?)`** → returns `{ revenue, maintenanceCost, fuelCost, otherExpenses, acquisitionCost, roi }` using the formula in §4.3. (`revenue` is a manually-entered or trip-rate-derived figure — see note in §4.3.)
- **`getFuelEfficiencyReport(filters?)`** → returns an array of `{ vehicleId, registrationNumber, totalDistanceKm, totalFuelL, fuelEfficiency }` per §4.1.
- **`exportFleetCSV(reportType, filters?)`** → server-side builds a CSV string (header row + data rows) from the same query as the on-screen report and returns it as a `Blob`/string for client-side download — no extra library needed for the mandatory CSV requirement.

---

## 4. Mathematical Formulas & Analytical Logic

### 4.1 Fuel Efficiency

**Formula:** `Fuel Efficiency = Total Distance / Total Fuel Consumed` (km per liter)

**SQL:**
```sql
select
  v.id as vehicle_id,
  v.registration_number,
  coalesce(sum(t.actual_distance_km), 0) as total_distance_km,
  coalesce(sum(t.fuel_consumed_l), 0) as total_fuel_l,
  case
    when coalesce(sum(t.fuel_consumed_l), 0) = 0 then null
    else round(sum(t.actual_distance_km) / sum(t.fuel_consumed_l), 2)
  end as fuel_efficiency_km_per_l
from vehicles v
left join trips t on t.vehicle_id = v.id and t.status = 'completed'
group by v.id, v.registration_number;
```

**TypeScript:**
```ts
function calculateFuelEfficiency(totalDistanceKm: number, totalFuelL: number): number | null {
  if (totalFuelL <= 0) return null; // avoid divide-by-zero; UI shows "No data" instead of Infinity
  return Math.round((totalDistanceKm / totalFuelL) * 100) / 100;
}
```

### 4.2 Total Operational Cost

**Formula:** `Total Operational Cost = Maintenance Costs + Fuel Costs + Other Expenses`

**SQL:**
```sql
select
  v.id as vehicle_id,
  v.registration_number,
  coalesce((select sum(m.cost) from maintenance m where m.vehicle_id = v.id), 0) as maintenance_cost,
  coalesce((select sum(f.cost) from fuel_logs f where f.vehicle_id = v.id), 0) as fuel_cost,
  coalesce((select sum(e.amount) from expenses e where e.vehicle_id = v.id), 0) as other_expenses,
  coalesce((select sum(m.cost) from maintenance m where m.vehicle_id = v.id), 0)
    + coalesce((select sum(f.cost) from fuel_logs f where f.vehicle_id = v.id), 0)
    + coalesce((select sum(e.amount) from expenses e where e.vehicle_id = v.id), 0) as total_operational_cost
from vehicles v;
```

**TypeScript:**
```ts
function calculateTotalOperationalCost(maintenanceCost: number, fuelCost: number, otherExpenses: number): number {
  return Math.round((maintenanceCost + fuelCost + otherExpenses) * 100) / 100;
}
```

### 4.3 Vehicle ROI

**Formula:** `Vehicle ROI = [Revenue - (Maintenance + Fuel)] / Acquisition Cost`

> **Note:** the schema in §1 doesn't include a dedicated `revenue` field, since the official spec doesn't define how revenue-per-trip is captured. For the hackathon build, the simplest option is a nullable `revenue` column on `trips` (entered on completion), summed per vehicle. This is called out explicitly rather than silently assumed — confirm with the judges/brief before building if time allows; otherwise default to `revenue = sum(trips.revenue)` with `0` fallback so the formula never breaks.

**SQL:**
```sql
select
  v.id as vehicle_id,
  v.registration_number,
  v.acquisition_cost,
  coalesce((select sum(t.revenue) from trips t where t.vehicle_id = v.id and t.status = 'completed'), 0) as revenue,
  coalesce((select sum(m.cost) from maintenance m where m.vehicle_id = v.id), 0) as maintenance_cost,
  coalesce((select sum(f.cost) from fuel_logs f where f.vehicle_id = v.id), 0) as fuel_cost,
  case
    when v.acquisition_cost = 0 then null
    else round(
      (
        coalesce((select sum(t.revenue) from trips t where t.vehicle_id = v.id and t.status = 'completed'), 0)
        - (
            coalesce((select sum(m.cost) from maintenance m where m.vehicle_id = v.id), 0)
            + coalesce((select sum(f.cost) from fuel_logs f where f.vehicle_id = v.id), 0)
          )
      ) / v.acquisition_cost,
      4
    )
  end as roi
from vehicles v;
```

**TypeScript:**
```ts
function calculateVehicleROI(
  revenue: number,
  maintenanceCost: number,
  fuelCost: number,
  acquisitionCost: number
): number | null {
  if (acquisitionCost <= 0) return null; // avoid divide-by-zero
  const roi = (revenue - (maintenanceCost + fuelCost)) / acquisitionCost;
  return Math.round(roi * 10000) / 10000; // 4 decimal places, display as %
}
```

### 4.4 Fleet Utilization Rate (%)

**Formula:** `Fleet Utilization Rate (%) = (Active Vehicles / Total Non-Retired Vehicles) * 100`

**SQL:**
```sql
select
  count(*) filter (where status = 'on_trip') as active_vehicles,
  count(*) filter (where status <> 'retired') as total_non_retired_vehicles,
  case
    when count(*) filter (where status <> 'retired') = 0 then 0
    else round(
      (count(*) filter (where status = 'on_trip')::numeric
        / count(*) filter (where status <> 'retired')) * 100,
      2
    )
  end as fleet_utilization_pct
from vehicles;
```

**TypeScript:**
```ts
function calculateFleetUtilization(activeVehicles: number, totalNonRetiredVehicles: number): number {
  if (totalNonRetiredVehicles === 0) return 0; // avoid divide-by-zero; empty fleet = 0% utilization
  return Math.round((activeVehicles / totalNonRetiredVehicles) * 10000) / 100;
}
```
