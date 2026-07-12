# TransitOps — Smart Transport & Fleet Operations Cockpit

TransitOps is a high-performance, production-grade logistics and fleet management cockpit built using Next.js 16 (App Router), Tailwind CSS, shadcn/ui, and Supabase PostgreSQL.

Designed for fleet managers, drivers, safety officers, and financial analysts, the platform features a dense, high-contrast dashboard, strict middleware-enforced role-based access control (RBAC), atomic trip dispatch transactions, and a workshop maintenance registry.

---

## 🎨 Design System & UI Dial Alignment
- **Aesthetic**: Dark tech theme, high information density cockpit layout with HSL CSS variables, and WCAG AA compliance.
- **Dials**: `DESIGN_VARIANCE: 4`, `MOTION_INTENSITY: 3`, `VISUAL_DENSITY: 7` (dense, scannable, and clean tabular grids).
- **Transitions**: 150ms hover states and explicit client side `cursor-pointer` indicators on all interactive elements.

---

## ⚡ Core Features & Operations

### 1. 📊 Operational Cockpit Dashboard (`/dashboard`)
*   **Fleet Utilization Telemetry**: Real-time progress ring tracking active vs. operational fleet capacity.
*   **KPI Cards**: Dense overview cards tracking Active Trips, Grounded Vehicles (In Shop), and Drivers on Duty.
*   **Realtime Trip Feed**: Multi-column tabular activity feed displaying locations, assignees, and color-coded status badges.
*   **Fleet Health Profile**: Linear progress meters mapping live service workloads.

### 2. 🔑 Authentication & RBAC Access Control (`/login`)
*   **Middleware Protection**: Intercepts all protected layout routes under `(app)` and redirects unauthenticated users to `/login`.
*   **Dynamic Layout Context**: Automatically resolves user identity via Supabase Auth and the `profiles` table to render names and role badges.
*   **Hackathon Persona Switcher**: Includes 4 interactive quick-login buttons directly on the login screen to allow judges to instantly switch roles (Fleet Manager, Driver, Safety Officer, Financial Analyst) without hitting API rate limits.
*   **Live Dropdown Switching**: Switching the persona dropdown in the main header dynamically switches the authenticated session and re-renders the layout immediately.

### 3. 🛣️ Trip Dispatch Center (`/trips`)
*   **New Trip Registry**: Collects cargo, distances, and routes.
*   **Validation Guard**: Rejects trips if cargo weight exceeds vehicle capacity (`cargo_weight_kg > vehicle.max_capacity`) or if the driver's license is expired.
*   **State-Aware Transitions**:
    *   *Draft*: Initial trip record.
    *   *Dispatched*: Atomic transaction locks both the vehicle and driver status to `on_trip` and updates the trip.
    *   *Completed*: Captures final distance and fuel consumed, increments the vehicle's odometer, logs fuel costs, and releases the assets back to `available`.
    *   *Cancelled*: Aborts the dispatch and restores vehicle/driver status to `available`.

### 4. 🔧 Fleet Maintenance Log (`/maintenance`)
*   **Workshop Registry**: Tracks repairs, service types, descriptions, and expenses.
*   **Grounding Guard**: Validates that vehicles currently active `on_trip` cannot be sent to the workshop. Creating an open maintenance ticket updates the vehicle status to `in_shop`.
*   **Ticket Closure**: Closing a repair ticket sets the closed timestamp and restores the vehicle's status to `available`.

---

## 📂 Architecture & Directory Map

```text
├── app/
│   ├── (app)/               # Protected application routes (authenticated cockpit)
│   │   ├── dashboard/       # Cockpit KPIs and recent trip feed
│   │   ├── trips/           # Trip dispatch center page
│   │   ├── maintenance/     # Fleet workshop registry page
│   │   └── layout.tsx       # Collapsible left sidebar navigation & persona switcher
│   ├── (auth)/              # Public authentication pages
│   │   ├── login/           # Form input & quick-login switcher grid
│   │   └── layout.tsx       # Centered auth container
│   ├── globals.css          # Custom HSL design tokens (light & dark theme)
│   ├── layout.tsx           # Global Next.js layout & ThemeProvider
│   └── page.tsx             # Root page redirect to /dashboard
├── components/
│   ├── shared/              # StatusBadge, KPICard, and ThemeToggle
│   └── ui/                  # Primitives (Badge, Button, Dialog, Input, Table, Tabs)
├── lib/
│   ├── actions/             # Server Actions (auth, analytics, trips, maintenance)
│   ├── supabase/            # Client, server, and middleware configurations
│   ├── validations/         # Zod schemas (vehicle, trip, maintenance)
│   └── utils.ts             # CN utility, formatters, and telemetry formulas
├── types/
│   └── database.ts          # Consolidated database rows and action interfaces
└── middleware.ts            # Root edge middleware router
```

---

## 🛠️ Local Setup & Installation

### 1. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Schema Seeding
To bypass SMTP rate limits when testing the persona switcher, copy the SQL trigger and insert statements from `supabase_seed_demo.sql` (located in the project root) and execute them in your **Supabase SQL Editor**. This sets up:
*   Trigger mapping auth signups to `public.profiles`.
*   The four demo accounts pre-seeded with the password: **`demo123456`**.

### 3. Install & Start Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the cockpit.

---

## 🚦 Verification & Production Build
To check TypeScript compiler status and perform verification tests:
```bash
npm run build
```
All routes (`/dashboard`, `/trips`, `/maintenance`) compile dynamic pages with clean static optimization assets.
