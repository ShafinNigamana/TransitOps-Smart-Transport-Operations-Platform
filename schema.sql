-- ===========================================================================
-- TRANSITOPS LOCAL POSTGRESQL SCHEMA & SEED SCRIPT
-- ===========================================================================

-- 1. Drop existing tables cascade for a clean reset
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.fuel_logs CASCADE;
DROP TABLE IF EXISTS public.maintenance CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;
DROP TABLE IF EXISTS public.drivers CASCADE;
DROP TABLE IF EXISTS public.vehicles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Drop existing triggers & functions
DROP TRIGGER IF EXISTS trg_vehicles_updated_at ON public.vehicles;
DROP TRIGGER IF EXISTS trg_drivers_updated_at ON public.drivers;
DROP TRIGGER IF EXISTS trg_trips_updated_at ON public.trips;
DROP TRIGGER IF EXISTS trg_maintenance_updated_at ON public.maintenance;
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.auth_role() CASCADE;

-- 3. Drop existing enums
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.vehicle_status CASCADE;
DROP TYPE IF EXISTS public.driver_status CASCADE;
DROP TYPE IF EXISTS public.trip_status CASCADE;
DROP TYPE IF EXISTS public.maintenance_status CASCADE;

-- 4. Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 5. Recreate Auth Schema and auth.users if they don't exist (for compatibility with non-Supabase local Postgres)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  encrypted_password text,
  raw_user_meta_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Recreate Enums
CREATE TYPE public.user_role AS ENUM ('fleet_manager', 'driver', 'safety_officer', 'financial_analyst');
CREATE TYPE public.vehicle_status AS ENUM ('available', 'on_trip', 'in_shop', 'retired');
CREATE TYPE public.driver_status AS ENUM ('available', 'on_trip', 'off_duty', 'suspended');
CREATE TYPE public.trip_status AS ENUM ('draft', 'dispatched', 'completed', 'cancelled');
CREATE TYPE public.maintenance_status AS ENUM ('open', 'closed');

-- 7. Recreate Profiles Table (extends auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role public.user_role NOT NULL DEFAULT 'driver',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- 8. Recreate Vehicles Table
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number text NOT NULL UNIQUE,
  name text NOT NULL,
  vehicle_type text NOT NULL,
  max_load_capacity_kg numeric(10,2) NOT NULL CHECK (max_load_capacity_kg > 0),
  odometer_km numeric(12,2) NOT NULL DEFAULT 0 CHECK (odometer_km >= 0),
  acquisition_cost numeric(14,2) NOT NULL CHECK (acquisition_cost >= 0),
  region text,
  status public.vehicle_status NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT registration_number_format CHECK (registration_number ~ '^[A-Za-z0-9-]{2,20}$')
);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_vehicles_type ON public.vehicles(vehicle_type);
CREATE INDEX idx_vehicles_region ON public.vehicles(region);

-- 9. Recreate Drivers Table
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  license_number text NOT NULL UNIQUE,
  license_category text NOT NULL,
  license_expiry_date date NOT NULL,
  contact_number text NOT NULL,
  safety_score numeric(5,2) NOT NULL DEFAULT 100 CHECK (safety_score BETWEEN 0 AND 100),
  status public.driver_status NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_drivers_status ON public.drivers(status);
CREATE INDEX idx_drivers_license_expiry ON public.drivers(license_expiry_date);

-- 10. Recreate Trips Table
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  destination text NOT NULL,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE RESTRICT,
  cargo_weight_kg numeric(10,2) NOT NULL CHECK (cargo_weight_kg > 0),
  planned_distance_km numeric(10,2) NOT NULL CHECK (planned_distance_km > 0),
  actual_distance_km numeric(10,2) CHECK (actual_distance_km >= 0),
  fuel_consumed_l numeric(10,2) CHECK (fuel_consumed_l >= 0),
  status public.trip_status NOT NULL DEFAULT 'draft',
  dispatched_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_trips_status ON public.trips(status);
CREATE INDEX idx_trips_vehicle ON public.trips(vehicle_id);
CREATE INDEX idx_trips_driver ON public.trips(driver_id);
CREATE INDEX idx_trips_created_at ON public.trips(created_at);

-- 11. Recreate Maintenance Table
CREATE TABLE public.maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  maintenance_type text NOT NULL,
  description text,
  cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  status public.maintenance_status NOT NULL DEFAULT 'open',
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT closed_at_after_opened CHECK (closed_at IS NULL OR closed_at >= opened_at)
);
CREATE INDEX idx_maintenance_vehicle ON public.maintenance(vehicle_id);
CREATE INDEX idx_maintenance_status ON public.maintenance(status);

-- 12. Recreate Fuel Logs Table
CREATE TABLE public.fuel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  liters numeric(10,2) NOT NULL CHECK (liters > 0),
  cost numeric(12,2) NOT NULL CHECK (cost >= 0),
  log_date date NOT NULL DEFAULT current_date,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fuel_logs_vehicle ON public.fuel_logs(vehicle_id);
CREATE INDEX idx_fuel_logs_date ON public.fuel_logs(log_date);

-- 13. Recreate Expenses Table
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  category text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  expense_date date NOT NULL DEFAULT current_date,
  notes text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_expenses_vehicle ON public.expenses(vehicle_id);
CREATE INDEX idx_expenses_date ON public.expenses(expense_date);

-- 14. Trigger Function to set updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Register updated_at triggers
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_drivers_updated_at BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_trips_updated_at BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_maintenance_updated_at BEFORE UPDATE ON public.maintenance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 15. User Creation & Sync Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Operator'),
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'driver'::public.user_role)
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================================================
-- SEED DATA SECTION
-- ===========================================================================

-- 1. Seed Demo accounts in auth.users
-- Password is 'demo123456' hashed with bcrypt
INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data)
VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'fleet@transitops.com', '$2a$10$w850zV6Z8tQ.9zM7jH2X2e0lH49k8/Vep1p9N8uOqjI74tL0v/tEq', '{"full_name": "Fleet Manager", "role": "fleet_manager"}'),
  ('b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e', 'driver@transitops.com', '$2a$10$w850zV6Z8tQ.9zM7jH2X2e0lH49k8/Vep1p9N8uOqjI74tL0v/tEq', '{"full_name": "Driver", "role": "driver"}'),
  ('c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f', 'safety@transitops.com', '$2a$10$w850zV6Z8tQ.9zM7jH2X2e0lH49k8/Vep1p9N8uOqjI74tL0v/tEq', '{"full_name": "Safety Officer", "role": "safety_officer"}'),
  ('d4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', 'finance@transitops.com', '$2a$10$w850zV6Z8tQ.9zM7jH2X2e0lH49k8/Vep1p9N8uOqjI74tL0v/tEq', '{"full_name": "Financial Analyst", "role": "financial_analyst"}');

-- Explicitly sync to profiles just in case the trigger isn't executing locally outside of Supabase env
INSERT INTO public.profiles (id, full_name, role)
VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Fleet Manager', 'fleet_manager'),
  ('b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e', 'Driver', 'driver'),
  ('c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f', 'Safety Officer', 'safety_officer'),
  ('d4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', 'Financial Analyst', 'financial_analyst')
ON CONFLICT (id) DO NOTHING;

-- 2. Seed 5 Vehicles
INSERT INTO public.vehicles (id, registration_number, name, vehicle_type, max_load_capacity_kg, odometer_km, acquisition_cost, region, status)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'NY-9821-X', 'Freightliner Cascadia', 'Heavy Truck', 36000.00, 142300.50, 125000.00, 'North-East', 'available'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CA-5512-Y', 'Volvo VNL 860', 'Heavy Truck', 36000.00, 98450.20, 140000.00, 'West-Coast', 'on_trip'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'TX-7734-Z', 'Ford F-550 Super Duty', 'Box Truck', 8800.00, 48120.90, 75000.00, 'South-East', 'in_shop'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'FL-3390-W', 'Isuzu NPR-HD', 'Box Truck', 6500.00, 62000.10, 62000.00, 'Gulf-Coast', 'on_trip'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'IL-8822-U', 'Peterbilt 579', 'Heavy Truck', 36000.00, 189400.00, 130000.00, 'Mid-West', 'retired');

-- 3. Seed 5 Drivers
INSERT INTO public.drivers (id, full_name, license_number, license_category, license_expiry_date, contact_number, safety_score, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Alex Johnson', 'CDL-NY98213', 'Class A', current_date + interval '365 days', '+1-555-0192', 98.50, 'available'),
  ('22222222-2222-2222-2222-222222222222', 'Marcus Brody', 'CDL-CA88210', 'Class A', current_date + interval '480 days', '+1-555-0143', 95.00, 'on_trip'),
  ('33333333-3333-3333-3333-333333333333', 'Sarah Jenkins', 'CDL-TX77421', 'Class B', current_date + interval '120 days', '+1-555-0154', 99.20, 'off_duty'),
  ('44444444-4444-4444-4444-444444444444', 'David Miller', 'CDL-FL33100', 'Class B', current_date - interval '30 days', '+1-555-0182', 82.00, 'suspended'),
  ('55555555-5555-5555-5555-555555555555', 'Elena Rostova', 'CDL-IL88921', 'Class A', current_date + interval '720 days', '+1-555-0167', 97.80, 'on_trip');

-- 4. Seed 8 Trips
INSERT INTO public.trips (id, source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, actual_distance_km, fuel_consumed_l, status, dispatched_at, completed_at, cancelled_at, created_by)
VALUES
  ('99999999-9999-9999-9999-999999999991', 'New York, NY', 'Boston, MA', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 12000.00, 350.00, 355.00, 95.50, 'completed', now() - interval '3 days', now() - interval '2 days', null, 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('99999999-9999-9999-9999-999999999992', 'Los Angeles, CA', 'Las Vegas, NV', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 8500.00, 430.00, null, null, 'dispatched', now() - interval '5 hours', null, null, 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('99999999-9999-9999-9999-999999999993', 'Chicago, IL', 'Detroit, MI', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 15000.00, 450.00, null, null, 'draft', null, null, null, 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('99999999-9999-9999-9999-999999999994', 'Houston, TX', 'Dallas, TX', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 10000.00, 380.00, 380.00, 102.00, 'completed', now() - interval '2 days', now() - interval '1 day', null, 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('99999999-9999-9999-9999-999999999995', 'Miami, FL', 'Orlando, FL', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '55555555-5555-5555-5555-555555555555', 5000.00, 380.00, null, null, 'cancelled', null, null, now() - interval '12 hours', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('99999999-9999-9999-9999-999999999996', 'Seattle, WA', 'Portland, OR', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 7200.00, 280.00, 282.00, 74.80, 'completed', now() - interval '6 days', now() - interval '5 days', null, 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('99999999-9999-9999-9999-999999999997', 'San Francisco, CA', 'Phoenix, AZ', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '55555555-5555-5555-5555-555555555555', 9800.00, 1200.00, null, null, 'dispatched', now() - interval '1 day', null, null, 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('99999999-9999-9999-9999-999999999998', 'Atlanta, GA', 'Charlotte, NC', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 6400.00, 390.00, null, null, 'draft', null, null, null, 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d');

-- 5. Seed 3 Maintenance Logs
INSERT INTO public.maintenance (id, vehicle_id, maintenance_type, description, cost, status, opened_at, closed_at, created_by)
VALUES
  ('33333333-3333-3333-3333-333333333331', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Oil Change & Filters', 'Routine 150k km engine service.', 150.00, 'closed', now() - interval '10 days', now() - interval '10 days', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('33333333-3333-3333-3333-333333333332', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Brake Replacement', 'Front brake pads and rotors worn out.', 450.00, 'open', now() - interval '1 day', null, 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
  ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Tire Rotation', 'Rotate all 18 drive wheels tires.', 80.00, 'closed', now() - interval '15 days', now() - interval '14 days', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d');

-- 6. Seed Fuel Logs (Financial Records)
INSERT INTO public.fuel_logs (id, vehicle_id, trip_id, liters, cost, log_date, created_by)
VALUES
  ('44444444-4444-4444-4444-444444444441', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999991', 95.50, 143.25, current_date - 2, 'd4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a'),
  ('44444444-4444-4444-4444-444444444442', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999994', 102.00, 153.00, current_date - 1, 'd4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a'),
  ('44444444-4444-4444-4444-444444444443', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999996', 74.80, 112.20, current_date - 5, 'd4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a');

-- 7. Seed Expenses (Financial Records)
INSERT INTO public.expenses (id, vehicle_id, trip_id, category, amount, expense_date, notes, created_by)
VALUES
  ('55555555-5555-5555-5555-555555555551', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999991', 'toll', 45.00, current_date - 2, 'George Washington Bridge Toll', 'd4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a'),
  ('55555555-5555-5555-5555-555555555552', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999996', 'parking', 25.00, current_date - 5, 'Overnight parking at secure terminal', 'd4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a'),
  ('55555555-5555-5555-5555-555555555553', 'cccccccc-cccc-cccc-cccc-cccccccccccc', null, 'fine', 150.00, current_date - 4, 'Emissions testing violation fine', 'd4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a');
