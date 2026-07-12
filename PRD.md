# TransitOps — Product Requirements Document (PRD)

**Project:** TransitOps — Smart Transport Operations Platform
**Context:** 8-Hour Hackathon Build
**Stack:** Next.js 14+ (App Router, TypeScript) · Tailwind + shadcn/ui + Lucide + Recharts/Tremor · Supabase (PostgreSQL, Auth, RLS, Realtime)

---

## 1. Executive Summary & Scope

### 1.1 Vision
TransitOps replaces the spreadsheet-and-logbook chaos that most small-to-mid logistics operators run on with a single, real-time source of truth for vehicles, drivers, trips, maintenance, and money. Every action a fleet takes — dispatching a truck, logging fuel, closing a maintenance ticket — updates the same data model instantly, so the dashboard is never lying to the person looking at it.

### 1.2 Problem Statement
Logistics teams currently track fleet operations across disconnected spreadsheets and paper logbooks. This produces five recurring failures:
- Vehicles get double-booked because nobody can see who has what in real time.
- Vehicles sit in a shop or are retired but still show up as "available" to whoever is dispatching.
- Drivers get assigned trips despite expired licenses or active suspensions, because status lives in someone's memory, not a system.
- Maintenance costs, fuel spend, and tolls are tracked in separate files, so nobody can answer "what did this vehicle actually cost us this quarter?" without a manual roll-up.
- There is no single dashboard that shows fleet health at a glance — utilization, active trips, compliance risk, and cost all live in different places.

### 1.3 Core Goals
1. Digitize the full lifecycle of a transport operation: vehicle → driver → trip → completion → maintenance → cost roll-up.
2. Enforce every business rule (capacity, licensing, double-booking, status transitions) at the point of action, not after the fact.
3. Give each of the four roles a workspace that only shows what's relevant to their job — Fleet Manager, Driver, Safety Officer, Financial Analyst.
4. Provide live operational analytics: fleet utilization, fuel efficiency, operational cost, and vehicle ROI, computed from real data, not manual formulas.
5. Ship a responsive, dark-mode-capable, production-shaped UI in 8 hours without cutting corners on data integrity.

### 1.4 Key Success Metrics (Hackathon Scoring Lens)
| Metric | Target | How it's judged |
|---|---|---|
| Business rule coverage | 10/10 mandatory rules enforced server-side | Live demo of each rule triggering a rejection |
| Workflow completeness | All 9 steps of the official example workflow pass | Sequential walkthrough during demo |
| Data integrity | Zero orphaned status states (e.g., vehicle stuck "On Trip" after a completed trip) | DB inspection post-demo |
| RBAC correctness | Each of the 4 roles sees only permitted data/actions | Login as each role during demo |
| Analytics accuracy | Fuel efficiency, cost, ROI, utilization match manually recomputed values | Spot-check against seed data |
| UI polish | Responsive across mobile/desktop, working dark mode, no unstyled/broken states | Visual review |

### 1.5 Out of Scope (This Build)
Per the official bonus list, the following are explicitly **not** required for the core deliverable and are only attempted if time remains: PDF export, email reminders for expiring licenses, vehicle document management (file uploads), and advanced search/sort beyond basic filtering. These are called out again in `SYSTEM_ARCHITECTURE.md` as stretch items so they don't quietly eat core-build time.

---

## 2. Target User Personas & RBAC Matrix

### 2.1 Personas

**Fleet Manager**
- Owns the vehicle lifecycle: registration, retirement, and maintenance oversight.
- Primary screens: Vehicle Registry, Maintenance, Dashboard.
- Success looks like: no vehicle is ever dispatched while unsafe or unavailable, and maintenance never gets forgotten.

**Driver** *(operations/dispatch persona per the official brief — creates and manages trips)*
- Creates trips by selecting source, destination, an available vehicle, and an available driver; monitors active deliveries end-to-end.
- Primary screens: Trip Management (create/dispatch/complete/cancel), Dashboard (active trips view).
- Success looks like: dispatching is fast, and the system refuses to let them make an invalid assignment rather than letting a bad trip through.

**Safety Officer**
- Owns driver compliance: license validity, suspensions, safety scores.
- Primary screens: Driver Management, Compliance widgets on Dashboard.
- Success looks like: no driver with an expired license or a suspension is ever selectable for a trip.

**Financial Analyst**
- Owns the money: fuel logs, expenses, operational cost, ROI.
- Primary screens: Fuel & Expense Management, Reports & Analytics.
- Success looks like: every dollar spent on every vehicle is traceable, and ROI/utilization numbers are trustworthy enough to act on.

### 2.2 RBAC Matrix

Legend: **C**reate · **R**ead · **U**pdate · **D**elete · `—` no access · scoped notes in *italics* below the table.

| Module | Fleet Manager | Driver | Safety Officer | Financial Analyst |
|---|---|---|---|---|
| Vehicles | C, R, U, D | R | R | R |
| Drivers | C, R, U | R | C, R, U, D | R |
| Trips | R, U *(dispatch/cancel only)* | C, R, U *(dispatch/complete/cancel)* | R | R |
| Maintenance | C, R, U, D | — | R | R |
| Fuel Logs | R | C, R | — | C, R, U, D |
| Expenses | R | C, R | — | C, R, U, D |
| Analytics | R (full fleet) | R *(own dispatched trips only)* | R *(compliance metrics only)* | R (full fleet) + CSV export |

*Notes:*
- **Fleet Manager** does not "delete" vehicles/drivers outright in the UI — vehicles are soft-retired (`status = 'retired'`) rather than hard-deleted, to preserve trip/maintenance history. `D` in the matrix maps to this retire action.
- **Driver's** Trip `U` is scoped to the three valid transitions (dispatch, complete, cancel) — they cannot edit a trip's core fields (vehicle, driver, cargo weight) after creation; a wrong draft is cancelled and recreated instead of patched.
- **Safety Officer** has no visibility into Fuel Logs/Expenses — compliance and financials are deliberately separated.
- All permissions are enforced twice: once in the UI (hide/disable controls) and once in Postgres Row Level Security policies (see `SYSTEM_ARCHITECTURE.md §1`), so a role restriction is never just a UI illusion.

---

## 3. User Epics & End-to-End User Stories

### Epic 1 — Dispatching a Trip (Driver persona)
**Story:** As a Driver, I want to create and dispatch a trip against an available vehicle and driver, so that cargo moves without double-booking or overloading anything.

**Journey:**
1. Open **Trips → New Trip**.
2. Fill source, destination, cargo weight, planned distance.
3. Vehicle dropdown only lists vehicles with `status = 'available'`; driver dropdown only lists drivers with `status = 'available'` **and** a non-expired license.
4. On submit, the system validates cargo weight ≤ selected vehicle's `max_load_capacity_kg`. If it fails, the form shows an inline error and nothing is written to the database.
5. Trip is created with `status = 'draft'`.
6. Driver clicks **Dispatch**. Server Action `dispatchTrip` re-validates (vehicle/driver still available, license still valid) and, in a single transaction, sets trip → `dispatched`, vehicle → `on_trip`, driver → `on_trip`.
7. Trip now appears in the "Active Trips" widget on the Dashboard in real time (Supabase Realtime).
8. On delivery, Driver opens the trip and clicks **Complete**, entering final odometer reading and fuel consumed. `completeTrip` sets trip → `completed`, vehicle/driver → `available`, and updates the vehicle's `odometer_km`.
9. If the trip is aborted mid-way, **Cancel** restores vehicle/driver to `available` without requiring odometer/fuel data.

### Epic 2 — Driver Safety Compliance (Safety Officer persona)
**Story:** As a Safety Officer, I want expired or suspended drivers automatically excluded from dispatch, so that no unsafe assignment can happen even if I forget to check manually.

**Journey:**
1. Safety Officer opens **Drivers**, sees a filterable table with a "License Expiry" column, sortable/filterable, with expiring-soon rows visually flagged (e.g., amber badge within 30 days, red if expired).
2. Safety Officer updates a driver's status to `suspended` after an incident, or the system itself treats `license_expiry_date < today` as an automatic exclusion regardless of stored status.
3. That driver silently disappears from every trip-creation dropdown fleet-wide — no separate "sync" step needed, because the exclusion is enforced at query time, not by a background job.
4. Safety Officer can filter the Drivers table specifically for "Suspended" or "Off Duty" to review who's currently benched and why.
5. Safety score updates are logged with a timestamp so Safety Officer can see trend over time (nice-to-have if time allows — core requirement is just the field being editable).

### Epic 3 — Logging Maintenance (Fleet Manager persona)
**Story:** As a Fleet Manager, I want a vehicle to be automatically pulled from the dispatch pool the moment I log maintenance on it, so that Drivers can never accidentally dispatch a vehicle that's in the shop.

**Journey:**
1. Fleet Manager opens **Maintenance → New Record**, selects a vehicle (any vehicle, regardless of current status — you can send an `on_trip` vehicle to maintenance once it returns, or send an `available` one in directly), enters maintenance type, description, and cost.
2. On submit, `createMaintenanceRecord` creates the maintenance row with `status = 'open'` **and** sets the linked vehicle's `status = 'in_shop'` in the same transaction.
3. That vehicle disappears from every trip-dispatch dropdown immediately.
4. When work is done, Fleet Manager clicks **Close** on the maintenance record. `closeMaintenanceRecord` sets maintenance → `closed`, `closed_at = now()`, and restores the vehicle to `available` — **unless** the vehicle's status was independently set to `retired`, in which case it stays `retired`.
5. Maintenance cost immediately factors into that vehicle's Total Operational Cost on the Analytics screen.

### Epic 4 — Reviewing Financial ROI (Financial Analyst persona)
**Story:** As a Financial Analyst, I want per-vehicle operational cost and ROI computed automatically from logged fuel, maintenance, and expenses, so that I don't have to manually reconcile three spreadsheets every month.

**Journey:**
1. Financial Analyst logs fuel entries (liters, cost, date) and miscellaneous expenses (tolls, fines, parking) against a vehicle and, optionally, a specific trip.
2. Analyst opens **Reports & Analytics**, filters by vehicle, date range, or region.
3. Dashboard shows, per vehicle: Fuel Efficiency (distance/fuel), Total Operational Cost (fuel + maintenance + other expenses), and Vehicle ROI (see formulas in `SYSTEM_ARCHITECTURE.md §4`).
4. Analyst exports the filtered view as CSV for finance reporting outside the app.
5. If a vehicle shows negative ROI, Analyst can drill into its maintenance and fuel history from the same screen to see why.

---

## 4. Functional & Non-Functional Requirements

### 4.1 UX/UI Requirements
- **Responsive layout:** Full functionality on mobile (single-column, collapsible nav) and desktop (sidebar + multi-column data views). Built with Tailwind breakpoints (`sm:`, `md:`, `lg:`); no horizontal scroll on core tables at 375px width — use card-list fallback for tables on mobile.
- **Dark mode toggle:** Persistent toggle in the top nav using `next-themes` (or an equivalent class-based approach) writing to `class="dark"` on `<html>`; the preference persists across sessions via cookie so server components can render the correct theme on first paint (no flash of unstyled theme).
- **Filterable datatables:** Every list view (Vehicles, Drivers, Trips, Maintenance, Fuel Logs, Expenses) supports filtering by status and at least one domain-relevant field (vehicle type/region for Vehicles; license category for Drivers; date range for Trips/Fuel Logs/Expenses), built on shadcn/ui `DataTable` (TanStack Table under the hood).
- **Modal forms:** Create/Edit actions open in a shadcn/ui `Dialog`, not a full page navigation, so the underlying list stays visible and state isn't lost on cancel.
- **Status badges:** Every status enum renders as a color-coded `Badge` component with a consistent palette across the app:
  - Vehicle: `available` (green), `on_trip` (blue), `in_shop` (amber), `retired` (gray)
  - Driver: `available` (green), `on_trip` (blue), `off_duty` (gray), `suspended` (red)
  - Trip: `draft` (gray), `dispatched` (blue), `completed` (green), `cancelled` (red)
  - Maintenance: `open` (amber), `closed` (green)

### 4.2 Performance Standards
- Dashboard KPI queries must return in under 500ms against seed data of ~200 vehicles / ~200 drivers / ~1,000 trips (achieved via the indexes defined in `SYSTEM_ARCHITECTURE.md §1` — status columns and foreign keys are indexed specifically because every dropdown and KPI query filters on them).
- List views paginate server-side (default 25 rows/page) rather than shipping the full table to the client.
- Server Actions perform all validation and status transitions inside a single Postgres transaction (via a `plpgsql` function or sequential awaited queries wrapped in error handling) so a failure partway through never leaves the vehicle/driver/trip states inconsistent with each other.

### 4.3 Security Standards
- All routes require an authenticated Supabase session; unauthenticated requests redirect to `/login`.
- RBAC is enforced at the database layer via Row Level Security (RLS) policies keyed off each user's role in the `profiles` table — never trust a client-side role check alone, since Server Actions and any direct API access must be equally protected.
- All mutating inputs are validated with Zod schemas **before** touching the database, both on the client (fast feedback) and again inside the Server Action (the client can't be trusted, since Server Actions are callable directly).
- Passwords are handled entirely by Supabase Auth (bcrypt hashing, managed sessions) — the app never stores or logs credentials.

### 4.4 Error Handling Standards
- Every Server Action returns a discriminated result: `{ success: true, data }` or `{ success: false, error: { code, message } }` — never throws raw exceptions to the client.
- Form-level validation errors surface inline, under the specific field, using the Zod error path.
- Business-rule rejections (e.g., "Cargo weight exceeds vehicle capacity") surface as a toast **and** an inline error, since this is the single most important class of error to make visible during the live demo.
- Unexpected server/database errors show a generic toast ("Something went wrong — please try again") and are logged server-side with the action name and payload (minus sensitive fields) for debugging — the user never sees a raw stack trace or SQL error string.
