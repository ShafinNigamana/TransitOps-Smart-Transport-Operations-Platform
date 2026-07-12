// TransitOps database row types — handwritten to match SYSTEM_ARCHITECTURE.md §1
// These mirror the Postgres schema exactly. Generated types can replace these later.

export type UserRole = "fleet_manager" | "driver" | "safety_officer" | "financial_analyst";
export type VehicleStatus = "available" | "on_trip" | "in_shop" | "retired";
export type DriverStatus = "available" | "on_trip" | "off_duty" | "suspended";
export type TripStatus = "draft" | "dispatched" | "completed" | "cancelled";
export type MaintenanceStatus = "open" | "closed";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  registration_number: string;
  name: string;
  vehicle_type: string;
  max_load_capacity_kg: number;
  odometer_km: number;
  acquisition_cost: number;
  region: string | null;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  full_name: string;
  license_number: string;
  license_category: string;
  license_expiry_date: string;
  contact_number: string;
  safety_score: number;
  status: DriverStatus;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicle_id: string;
  driver_id: string;
  cargo_weight_kg: number;
  planned_distance_km: number;
  actual_distance_km: number | null;
  fuel_consumed_l: number | null;
  status: TripStatus;
  dispatched_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Maintenance {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  description: string | null;
  cost: number;
  status: MaintenanceStatus;
  opened_at: string;
  closed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FuelLog {
  id: string;
  vehicle_id: string;
  trip_id: string | null;
  liters: number;
  cost: number;
  log_date: string;
  created_by: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  vehicle_id: string | null;
  trip_id: string | null;
  category: string;
  amount: number;
  expense_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

// Server Action discriminated result type per SYSTEM_ARCHITECTURE.md §3
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// Fleet KPI aggregate shape per SYSTEM_ARCHITECTURE.md §3.11
export interface FleetKPIs {
  totalVehicles: number;
  activeVehicles: number;
  availableVehicles: number;
  vehiclesInMaintenance: number;
  retiredVehicles: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  totalDrivers: number;
  fleetUtilizationPct: number;
}
