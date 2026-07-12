# 🚚 TransitOps

<p align="center">
  <strong>Smart Transport & Fleet Operations Cockpit</strong><br />
  A real-time transport management platform designed to eliminate logistics spreadsheet chaos and enforce business rules at the point of action.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2.10-black?style=flat-square&logo=next.js" alt="Next.js Badge" />
  <img src="https://img.shields.io/badge/React-19.2.4-blue?style=flat-square&logo=react" alt="React Badge" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.0.0-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS Badge" />
  <img src="https://img.shields.io/badge/Zod-4.4.3-3E67B1?style=flat-square&logo=zod" alt="Zod Badge" />
  <img src="https://img.shields.io/badge/PostgreSQL-pg_8.22.0-blue?style=flat-square&logo=postgresql" alt="PostgreSQL Badge" />
  <img src="https://img.shields.io/badge/Recharts-3.9.2-22C55E?style=flat-square" alt="Recharts Badge" />
</p>

---

## 📖 Table of Contents

- [The Problem](#-the-problem)
- [The Solution](#-the-solution)
- [System Architecture](#-system-architecture)
- [Database Schema (ERD)](#-database-schema-erd)
- [Status Lifecycles](#-status-lifecycles)
- [Guarded Dispatch, Visualized](#-guarded-dispatch-visualized)
- [Business Rules Enforced](#-business-rules-enforced)
- [Roles & Access (RBAC)](#-roles--access-rbac)
- [Tech Stack](#-tech-stack)
- [Screens & Directory Map](#-screens--directory-map)
- [Getting Started](#-getting-started)
- [Analytics Formulas](#-analytics-formulas)
- [Verification Checklist](#-verification-checklist)
- [Known Gaps & Deferred Items](#-known-gaps--deferred-items)
- [License](#-license)

---

## ⚠️ The Problem

Logistics operators frequently manage fleet assets, drivers, dispatches, maintenance, and operational expenses across disconnected spreadsheets and physical paper logs. This fragmentation causes several critical operational failures:
* **Double-Bookings:** Lack of real-time visibility leads to dispatchers assigning the same driver or vehicle to concurrent runs.
* **Grounded Dispatches:** Vehicles that are retired or actively undergoing repairs in the workshop show up as "available" in static systems and get assigned to trips.
* **Compliance Risks:** Drivers with expired licenses or active suspensions are dispatched because compliance audits live in filing cabinets rather than at the dispatch gateway.
* **Siloed Costs & Blindspots:** Fuel spend, maintenance invoices, and miscellaneous trip expenses are tracked in isolated sheets, preventing a unified calculation of vehicle ROI or fleet-wide utilization.

---

## ✨ The Solution

**TransitOps** provides a unified, real-time command cockpit that guarantees operational integrity by enforcing compliance and business rules server-side before writes occur.

* **Vehicles Module:** A live registry monitoring availability, capacity thresholds, active locations, and odometer logs.
* **Trips & Dispatch Module:** An atomic dispatch controller that locks assets and enforces weight and licensing rules during creation and execution.
* **Maintenance Module:** A workshop tracking registry that grounds vehicles immediately when repair tickets open and releases them only upon verified closure.
* **Financials & Analytics:** Direct entry portals for fuel logs and expenses, feeding live charts, KPI cards, and dynamic Vehicle ROI sheets.

---

## 🏗️ System Architecture

TransitOps is structured to maintain full data integrity and prevent UI bypasses. Authenticated pages and mutating Server Actions validate requests against PostgreSQL and state matrices.

```mermaid
graph TD
    Client[Next.js Server & Client Components] --> Middleware[Auth Middleware: Session Check]
    Middleware --> |Authenticated| Router[App Routes]
    Router --> Actions[Server Actions: lib/actions]
    Actions --> Zod[Zod Validation: lib/validations]
    Zod --> |Valid| MockClient[Supabase Mock client.ts / server.ts]
    MockClient --> |Direct pg Pool Connection| PG[(Local PostgreSQL Database)]
    PG --> Triggers[set_updated_at & handle_new_user Triggers]
    PG --> RLS[Row Level Security Policies]
```

> [!NOTE]
> The Supabase client is a high-performance custom server-side integration that connects directly to the local PostgreSQL database using the `pg` driver Pool, securing user sessions via cookie-backed base64 token payloads.

---

## 🗄️ Database Schema (ERD)

The database schema is defined in [schema.sql](file:///d:/MyProject/ODOO/transitops/schema.sql) and is mapped inside [types/database.ts](file:///d:/MyProject/ODOO/transitops/types/database.ts).

```mermaid
erDiagram
    profiles {
        uuid id PK
        text full_name
        user_role role
        timestamptz created_at
        timestamptz updated_at
    }
    vehicles {
        uuid id PK
        text registration_number UK
        text name
        text vehicle_type
        numeric max_load_capacity_kg
        numeric odometer_km
        numeric acquisition_cost
        text region
        vehicle_status status
        timestamptz created_at
        timestamptz updated_at
    }
    drivers {
        uuid id PK
        text full_name
        text license_number UK
        text license_category
        date license_expiry_date
        text contact_number
        numeric safety_score
        driver_status status
        timestamptz created_at
        timestamptz updated_at
    }
    trips {
        uuid id PK
        text trip_code UK
        text source
        text destination
        uuid vehicle_id FK
        uuid driver_id FK
        numeric cargo_weight_kg
        numeric planned_distance_km
        numeric actual_distance_km
        numeric fuel_consumed_l
        trip_status status
        timestamptz dispatched_at
        timestamptz completed_at
        timestamptz cancelled_at
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }
    maintenance {
        uuid id PK
        uuid vehicle_id FK
        text maintenance_type
        text description
        numeric cost
        maintenance_status status
        timestamptz opened_at
        timestamptz closed_at
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }
    fuel_logs {
        uuid id PK
        uuid vehicle_id FK
        uuid trip_id FK
        numeric liters
        numeric cost
        date log_date
        uuid created_by FK
        timestamptz created_at
    }
    expenses {
        uuid id PK
        uuid vehicle_id FK
        uuid trip_id FK
        text category
        numeric amount
        date expense_date
        text notes
        uuid created_by FK
        timestamptz created_at
    }

    profiles ||--o{ trips : "creates"
    profiles ||--o{ maintenance : "authorizes"
    profiles ||--o{ fuel_logs : "records"
    profiles ||--o{ expenses : "records"
    vehicles ||--o{ trips : "assigned to"
    vehicles ||--o{ maintenance : "undergoes"
    vehicles ||--o{ fuel_logs : "uses fuel"
    vehicles ||--o{ expenses : "incurs"
    drivers ||--o{ trips : "drives"
    trips ||--o{ fuel_logs : "logs fuel for"
    trips ||--o{ expenses : "incurs expenses on"
```

<details>
<summary>🔑 Click to view raw DDL Schema SQL</summary>

```sql
CREATE TYPE public.user_role AS ENUM ('fleet_manager', 'driver', 'safety_officer', 'financial_analyst');
CREATE TYPE public.vehicle_status AS ENUM ('available', 'on_trip', 'in_shop', 'retired');
CREATE TYPE public.driver_status AS ENUM ('available', 'on_trip', 'off_duty', 'suspended');
CREATE TYPE public.trip_status AS ENUM ('draft', 'dispatched', 'completed', 'cancelled');
CREATE TYPE public.maintenance_status AS ENUM ('open', 'closed');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role public.user_role NOT NULL DEFAULT 'driver',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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

CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_code text NOT NULL UNIQUE,
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
```

</details>

---

## 🔄 Status Lifecycles

Asset availability and trip progression are restricted to verified status transitions:

### Vehicle Status Lifecycle
```mermaid
stateDiagram-v2
    [*] --> available
    available --> on_trip : Trip Dispatched
    on_trip --> available : Trip Completed/Cancelled
    available --> in_shop : Maintenance Opened
    in_shop --> available : Maintenance Closed (Normal)
    available --> retired : Vehicle Retired
    in_shop --> retired : Vehicle Retired
    on_trip --> retired : Cannot Retire (Guarded)
    retired --> [*]
```

### Driver Status Lifecycle
```mermaid
stateDiagram-v2
    [*] --> available
    available --> on_trip : Trip Dispatched
    on_trip --> available : Trip Completed/Cancelled
    available --> off_duty : Driver goes Off Duty
    off_duty --> available : Driver returns On Duty
    available --> suspended : Suspended by Safety Officer
    suspended --> available : Suspension Lifted
    on_trip --> suspended : Cannot Suspend (Guarded)
```

### Trip Status Lifecycle
```mermaid
stateDiagram-v2
    [*] --> draft
    draft --> dispatched : Dispatch Triggered
    dispatched --> completed : Odometer & Fuel Logged
    draft --> cancelled : Cancelled before run
    dispatched --> cancelled : Run Aborted (Assets Released)
    completed --> [*]
    cancelled --> [*]
```

---

## 🛡️ Guarded Dispatch, Visualized

The `dispatchTrip` Server Action runs validations against the database before executing updates to prevent race conditions or invalid schedules.

```mermaid
sequenceDiagram
    autonumber
    Client Component->>+dispatchTrip Action: Invoke with tripId
    dispatchTrip Action->>+Database: Fetch Trip Status, Vehicle ID & Driver ID
    Database-->>-dispatchTrip Action: Trip data
    alt Trip is not 'draft'
        dispatchTrip Action-->>Client Component: Return error INVALID_STATUS
    end
    dispatchTrip Action->>+Database: Fetch Vehicle & Driver current status & details
    Database-->>-dispatchTrip Action: Vehicle & Driver rows
    alt Vehicle is not 'available'
        dispatchTrip Action-->>Client Component: Return error VEHICLE_UNAVAILABLE
    alt Driver is not 'available'
        dispatchTrip Action-->>Client Component: Return error DRIVER_UNAVAILABLE
    alt Driver license expires within 30 days
        dispatchTrip Action-->>Client Component: Return error EXPIRED_LICENSE
    end
    dispatchTrip Action->>+Database: Update vehicle status -> 'on_trip'
    dispatchTrip Action->>Database: Update driver status -> 'on_trip'
    dispatchTrip Action->>Database: Update trip status -> 'dispatched', set dispatched_at = now()
    Database-->>-dispatchTrip Action: Transaction success
    dispatchTrip Action->>Client Component: Return success with updated Trip data & revalidatePath()
```

---

## 🔒 Business Rules Enforced

The following core business rules are validated inside the Server Action layers to guarantee that database records are accurate and consistent:

| Rule | Description | Primary Enforcement File | Database Constraint / RLS |
| :--- | :--- | :--- | :--- |
| **Rule 1: Reg Format & Uniqueness** | Vehicle registration must match `^[A-Za-z0-9-]{2,20}$` and be globally unique. | [lib/actions/vehicles.ts](file:///d:/MyProject/ODOO/transitops/lib/actions/vehicles.ts) | `UNIQUE` constraint, `CHECK (registration_number ~ '...')` |
| **Rule 2: Cargo Weight Guard** | Cargo weight cannot exceed the selected vehicle's maximum weight capacity. | [lib/actions/trips.ts](file:///d:/MyProject/ODOO/transitops/lib/actions/trips.ts) | `CHECK (cargo_weight_kg > 0)` |
| **Rule 3: Workshop/Retired Exclusions** | 'In Shop' and 'Retired' vehicles are excluded from trip selectors and cannot be dispatched. | [lib/actions/trips.ts](file:///d:/MyProject/ODOO/transitops/lib/actions/trips.ts) | State check queries inside actions |
| **Rule 4: Driver Compliance Check** | Exclude drivers with expired, soon-to-expire (<30 days), suspended, or off-duty status from dispatches. | [lib/actions/trips.ts](file:///d:/MyProject/ODOO/transitops/lib/actions/trips.ts) | Expiry check & status check queries |
| **Rule 5: Double-Booking Prevention** | Prevent dispatching if the vehicle or driver is already assigned to an active trip. | [lib/actions/trips.ts](file:///d:/MyProject/ODOO/transitops/lib/actions/trips.ts) | Asset status validation in `dispatchTrip` |
| **Rule 6: Dispatch Transition** | Dispatching moves the trip to `dispatched` and locks vehicle/driver status to `on_trip`. | [lib/actions/trips.ts](file:///d:/MyProject/ODOO/transitops/lib/actions/trips.ts) | Wrapped inside sequential execution block |
| **Rule 7: Completion Odometer** | Completing a trip releases assets to `available`, logs actual fuel, and increments vehicle odometer. | [lib/actions/trips.ts](file:///d:/MyProject/ODOO/transitops/lib/actions/trips.ts) | `CHECK (actual_distance_km >= 0)` |
| **Rule 8: Dispatch Cancellation** | Cancelling an active trip sets status to `cancelled` and immediately releases assets. | [lib/actions/trips.ts](file:///d:/MyProject/ODOO/transitops/lib/actions/trips.ts) | State restoration queries |
| **Rule 9: Maintenance Grounding** | Creating an open maintenance ticket sets vehicle status to `in_shop` (disallowed if vehicle is `on_trip`). | [lib/actions/maintenance.ts](file:///d:/MyProject/ODOO/transitops/lib/actions/maintenance.ts) | Status check inside Server Action |
| **Rule 10: Maintenance Release** | Closing maintenance releases the vehicle to `available` (unless the vehicle has been retired). | [lib/actions/maintenance.ts](file:///d:/MyProject/ODOO/transitops/lib/actions/maintenance.ts) | Status restoration logic |

---

## 🔑 Roles & Access (RBAC)

RBAC controls are verified via Next.js Middleware redirects and enforced inside database Row Level Security (RLS) policies.

| Module / Action | Fleet Manager | Driver | Safety Officer | Financial Analyst |
| :--- | :---: | :---: | :---: | :---: |
| **Vehicles (Create/Update/Retire)** | **Allowed** | Read-Only | Read-Only | Read-Only |
| **Drivers (Create/Update/Suspend)** | **Allowed** | Read-Only | **Allowed** | Read-Only |
| **Trips (Create/Dispatch/Complete)** | Dispatch/Cancel | **Full Access** | Read-Only | Read-Only |
| **Maintenance (Open/Close)** | **Allowed** | No Access | Read-Only | Read-Only |
| **Fuel Logs (Create/Read/Edit)** | Read-Only | Create / Read | No Access | **Full Access** |
| **Expenses (Create/Read/Edit)** | Read-Only | Create / Read | No Access | **Full Access** |
| **Analytics & CSV Export** | Read-Only | No Access | Read-Only | **Full Access** |

---

## 🛠️ Tech Stack

| Layer | Technology | Reason |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.2.10 (App Router) | Native support for Server Components, layout isolation, and server actions. |
| **Language** | TypeScript 5.0 | Enforces static type definitions across database models and inputs. |
| **Styling** | Tailwind CSS v4 | Provides atomic utility classes and configuration. |
| **UI Primitive** | shadcn/ui (Radix UI) | Accessible, unstyled primitives customizable via tailwind configurations. |
| **Visualizations** | Recharts 3.9.2 | Renders declarative charts directly inside client containers. |
| **Database** | PostgreSQL | Local relational database for transactional queries and trigger integrations. |
| **Validations** | Zod 4.4.3 | Shared schemas for form input and Server Action validation. |

---

## 📂 Screens & Directory Map

The dashboard contains the following active routes:

* `/login` - Quick Switcher logins for all 4 roles + standard credentials form.
* `/dashboard` - Fleet status metrics, active trips widget, and dynamic layout badges.
* `/vehicles` - Table overview, registrations, type breakdowns, and "Add Vehicle" dialogs.
* `/drivers` - Status tracking, license expirations, safety compliance scores.
* `/trips` - Tabbed list of trips (Draft, Dispatched, Completed, Cancelled) and trip operations.
* `/maintenance` - Opened and closed service ticket registers.
* `/fuel-logs` - Fuel purchase entry sheets.
* `/expenses` - Dynamic catalog lists mapping categorized operational overheads.
* `/analytics` - Dynamic graphs mapping fuel efficiency, total operating overheads, and ROI sheets.

<!-- screenshot: login -->
<!-- screenshot: dashboard -->
<!-- screenshot: vehicles -->
<!-- screenshot: drivers -->
<!-- screenshot: trips -->
<!-- screenshot: maintenance -->
<!-- screenshot: fuel_logs -->
<!-- screenshot: expenses -->
<!-- screenshot: analytics -->

---

## 🚀 Getting Started

### 1. Set Up Environment Variables
Create a file named `.env.local` in the project root:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
```

### 2. Prepare Database Schema
Run the contents of [schema.sql](file:///d:/MyProject/ODOO/transitops/schema.sql) in your local PostgreSQL client or database editor. This drops old instances, constructs enums, defines tables, constructs indexes, and registers trigger callbacks.

### 3. Seed Demo Accounts & Data
Execute the seed segment inside [schema.sql](file:///d:/MyProject/ODOO/transitops/schema.sql) to provision the demo personas:
- **Fleet Manager:** `fleet@transitops.com` (password: `demo123456`)
- **Driver:** `driver@transitops.com` (password: `demo123456`)
- **Safety Officer:** `safety@transitops.com` (password: `demo123456`)
- **Financial Analyst:** `finance@transitops.com` (password: `demo123456`)

### 4. Install Dependencies & Run
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application dashboard.

---

## 📈 Analytics Formulas

Operational statistics are calculated inside [lib/actions/analytics.ts](file:///d:/MyProject/ODOO/transitops/lib/actions/analytics.ts):

* **Fuel Efficiency (km/L):** Calculated as `Total Distance / Total Fuel Consumed`. Divisors of 0 degrade gracefully to `null` to avoid errors.
  $$\text{Fuel Efficiency} = \frac{\sum \text{actual\_distance\_km}}{\sum \text{fuel\_consumed\_l}}$$
* **Total Operational Cost:** Calculated per vehicle as the sum of maintenance records, fuel expenses, and miscellaneous logs.
  $$\text{Total Operational Cost} = \sum \text{maintenance.cost} + \sum \text{fuel\_logs.cost} + \sum \text{expenses.amount}$$
* **Vehicle ROI:** Calculated as `[Revenue - (Maintenance + Fuel)] / Acquisition Cost` (revenue defaults to 0 since trip revenue is not captured in this DB schema version).
  $$\text{Vehicle ROI} = \frac{0 - (\sum \text{maintenance.cost} + \sum \text{fuel\_logs.cost})}{\text{acquisition\_cost}}$$
* **Fleet Utilization Rate (%):** Calculates active vehicles out of non-retired vehicles.
  $$\text{Fleet Utilization Rate} = \left( \frac{\text{Vehicles with status 'on\_trip'}}{\text{Vehicles with status } \neq \text{ 'retired'}} \right) \times 100$$

---

## 🚦 Verification Checklist

Follow these steps during testing or a live review:

| Step | Action | Target Input | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :---: |
| **1** | Register a new vehicle | Reg: `"VAN-05"`, Capacity: `500` | Created successfully; status shows as `available` in list | Validated |
| **2** | Register a new driver | License Expiry: `Future date` | Created successfully; status shows as `available` in list | Validated |
| **3** | Create a draft trip | Cargo: `450 kg` | Trip created in `draft` state | Validated |
| **4** | Cargo validation check | Try cargo: `600 kg` | Safe-check blocks submit with overweight warnings | Validated |
| **5** | Dispatch the trip | Click "Dispatch" | Vehicle and driver status change to `on_trip` in real time | Validated |
| **6** | Double-booking check | Try to dispatch another trip with same driver | Action rejects the request with resource unavailable error | Validated |
| **7** | Complete the trip | Distance: `200`, Fuel: `40` | Trip status set to `completed`; vehicle odometer increments by 200 | Validated |
| **8** | Grounding check | Open maintenance for "VAN-05" | Vehicle status changes to `in_shop`; VAN-05 is hidden from trip selectors | Validated |
| **9** | Financial reporting check | Open reports dashboard | VAN-05 operational cost updates with maintenance and fuel expenses | Validated |

---

## 🚧 Known Gaps & Deferred Items

The following features were excluded from the hackathon build by choice:
* **Trip Billing Revenue:** The database schema does not feature a dynamic `revenue` column per trip, so ROI reports default to a base revenue of 0.
* **Document Management:** File uploads for vehicle registrations and driver CDL files are excluded.
* **Automated Expiry Notifications:** Email notifications for expiring driver licenses are excluded; license compliance check is performed during dispatch.
* **Advanced Text Search:** Table dashboards feature query-filters matching status parameters and registration queries but do not support fuzzy search indices.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
