export type UserRole =
  | "fleet_manager"
  | "driver"
  | "safety_officer"
  | "financial_analyst";

export type VehicleStatus = "available" | "on_trip" | "in_shop" | "retired";

export type DriverStatus = "available" | "on_trip" | "off_duty" | "suspended";

export type TripStatus = "draft" | "dispatched" | "completed" | "cancelled";

export type MaintenanceStatus = "open" | "closed";

export interface Vehicle {
  id: string;
  registration_number: string;
  name: string;
  vehicle_type: string;
  max_load_capacity_kg: number;
  odometer_km: number;
  acquisition_cost: number;
  region?: string;
  status: VehicleStatus;
  created_at?: string;
  updated_at?: string;
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
  created_at?: string;
  updated_at?: string;
}

export interface Trip {
  id: string;
  trip_code?: string;
  source: string;
  destination: string;
  vehicle_id: string;
  vehicle?: Vehicle;
  driver_id: string;
  driver?: Driver;
  cargo_weight_kg: number;
  planned_distance_km: number;
  actual_distance_km?: number;
  fuel_consumed_l?: number;
  status: TripStatus;
  dispatched_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  vehicle?: Vehicle;
  maintenance_type: string;
  description: string;
  cost: number;
  status: MaintenanceStatus;
  opened_at: string;
  closed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export type CreateTripInput = {
  source: string;
  destination: string;
  cargo_weight_kg: number;
  planned_distance_km: number;
  vehicle_id: string;
  driver_id: string;
};

export type CompleteTripInput = {
  trip_id: string;
  actual_distance_km: number;
  fuel_consumed_l: number;
};

export type CreateMaintenanceInput = {
  vehicle_id: string;
  maintenance_type: string;
  description: string;
  cost: number;
};
