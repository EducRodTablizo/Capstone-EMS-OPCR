# EMS Sprint 1 & Sprint 2 — Implementation Plan

## Context
This is the **frontend** of the Evaluation & Monitoring System (EMS), one of 3 capstone subsystems:
- **ARMS** – Administrative & Records Management System (Central Auth / JWT issuer)
- **PSS** – Planning & Scheduling System (SLA rules, working-day calendars)
- **EMS** – Evaluation & Monitoring System ← this project

Tech stack: React + Vite + TypeScript + TailwindCSS (frontend) / NestJS + PostgreSQL (backend, external).  
JWT tokens are issued by ARMS; EMS validates them. No Supabase — API calls go to NestJS.

---

## Deliverables

### A — React Frontend (this repo)
All Sprint 1 + 2 user stories implemented as pages/components.

### B — PostgreSQL SQL Files (in `/database/`)
Complete ERD schema, functions, triggers, and seed queries for NestJS to use.

---

## Sprint 1 User Stories Covered

| Story | Feature |
|-------|---------|
| EMS-001 | Read-only active users list (synced from ARMS) |
| EMS-002 | JWT role + office claims → scoped views |
| EMS-003 | Cross-office modification blocked (UI + API guard hooks) |
| EMS-004 | Create transaction → auto time-in on creation |
| EMS-005 | Assign transaction to same-office staff |
| EMS-006 | Status flow: Pending → In Progress → Completed (timestamped) |
| EMS-007 | Documentary status: Complete / Incomplete / For Compliance |

## Sprint 2 User Stories Covered

| Story | Feature |
|-------|---------|
| EMS-008 | Auto time-out when transaction marked Completed |
| EMS-009 | Processing time = time-out − time-in (excluding Incomplete pauses) |
| EMS-010 | Compare actual duration vs SLA from PSS (mocked API call with fallback cache) |
| EMS-011 | Auto-classify Compliant / Non-Compliant (read-only badge) |
| EMS-012 | SLA-breached transactions flagged & highlighted on dashboard |

---

## Project File Structure

```
src/
├── api/                        # Axios API layer (NestJS endpoints)
│   ├── auth.ts                 # JWT token decode, refresh
│   ├── users.ts                # GET /users (ARMS-synced)
│   ├── transactions.ts         # CRUD transactions
│   └── sla.ts                  # Fetch SLA rules from PSS
├── auth/
│   ├── AuthContext.tsx         # JWT context (decode roles, office claims)
│   ├── useAuth.ts              # Hook: user, role, office, isAdmin
│   └── ProtectedRoute.tsx      # Role/office guard wrapper
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx       # Sidebar + topbar shell
│   │   ├── Sidebar.tsx         # Role-aware nav
│   │   └── TopBar.tsx          # Current user chip, logout
│   ├── ui/                     # shadcn components (button, badge, table, dialog…)
│   └── shared/
│       ├── StatusBadge.tsx     # Pending / In Progress / Completed badges
│       ├── SLABadge.tsx        # Compliant / Non-Compliant / Pending Computation
│       └── DocumentaryBadge.tsx
├── pages/
│   ├── LoginPage.tsx           # JWT login form (calls ARMS auth endpoint)
│   ├── DashboardPage.tsx       # EMS-012: SLA breach highlights, counters
│   ├── UsersPage.tsx           # EMS-001/002/003: read-only user list
│   ├── TransactionsPage.tsx    # EMS-004/005/006/007: transaction table + create
│   ├── TransactionDetailPage.tsx # Status timeline, documentary status, SLA result
│   └── SLAReviewPage.tsx       # EMS-010/011/012: SLA compliance table
├── hooks/
│   ├── useOfficeGuard.ts       # EMS-003: blocks cross-office ops
│   └── useSLACompute.ts        # EMS-009/011: processing time + compliance calc
├── types/
│   └── index.ts                # All shared TypeScript interfaces
├── utils/
│   ├── jwt.ts                  # Decode JWT payload (no verify — NestJS does that)
│   ├── slaUtils.ts             # Duration formatting, SLA parse helpers
│   └── timeUtils.ts            # Processing time computation (excl. pauses)
├── App.tsx
└── main.tsx

database/
├── 01_schema.sql               # All tables with constraints
├── 02_functions.sql            # compute_processing_time, check_sla_compliance
├── 03_triggers.sql             # auto time-in, auto time-out, auto SLA classify
├── 04_seed.sql                 # Seed: offices, services (from OPCR CSV), roles
└── ERD.md                      # Entity-Relationship description
```

---

## Key Data Models (TypeScript + SQL)

### Users (synced from ARMS, read-only in EMS)
```
id, name, email, role (subsystem_admin | staff | opcr_evaluator), office_id, is_active
```

### Offices
```
id, name, code (ADMIN_OFFICE | ACADEMIC_OFFICE | OSAS)
```

### Services (from OPCR SLA CSV)
```
id, name, category, client_type, office_id, sla_target_seconds, is_active
```

### Transactions
```
id, service_id, office_id, assigned_to (user_id), created_by,
time_in (auto on creation), time_out (auto on Completed),
status (pending | in_progress | completed),
documentary_status (complete | incomplete | for_compliance),
processing_time_seconds (computed), sla_status (compliant | non_compliant | pending_computation),
is_sla_breached, created_at, updated_at
```

### TransactionStatusHistory (audit trail for Sprint 3)
```
id, transaction_id, old_status, new_status, changed_by, changed_at, remarks
```

---

## PostgreSQL: Key Triggers & Functions

### `fn_compute_processing_time(transaction_id)`
- Sums all `in_progress` periods, subtracts `incomplete` paused windows
- Returns integer seconds

### `fn_classify_sla(transaction_id)`
- Fetches SLA target from services table
- Compares processing_time_seconds → sets sla_status + is_sla_breached

### `trg_auto_time_in` (BEFORE INSERT on transactions)
- Sets `time_in = NOW()` always

### `trg_auto_time_out` (BEFORE UPDATE on transactions)
- When `status` changes to `completed`, sets `time_out = NOW()`
- Then calls `fn_compute_processing_time` + `fn_classify_sla`

### `trg_status_history` (AFTER UPDATE on transactions)
- Inserts row into transaction_status_history on any status change

---

## JWT Auth Flow (Frontend)

1. **Login Page** → POST to `ARMS /auth/login` → receives `{ access_token }`
2. Token stored in `localStorage` (or memory + refresh cookie — configurable)
3. `AuthContext` decodes payload: `{ sub, name, role, office_id, office_code }`
4. All API calls attach `Authorization: Bearer <token>` via Axios interceptor
5. 401 responses → redirect to login
6. `ProtectedRoute` checks role claims before rendering pages
7. `useOfficeGuard` hook checks `office_id` match before any mutation action

---

## Role-Based Access Matrix

| Page / Action | Staff | Subsystem Admin | OPCR Evaluator |
|---|---|---|---|
| View own-office users | ✓ | ✓ | read-only |
| Create transaction | ✓ | ✓ | ✗ |
| Assign transaction | own office | all in office | ✗ |
| Update status | ✓ | ✓ | ✗ |
| SLA Review page | ✗ | ✓ | read-only |
| Dashboard | ✓ | ✓ | read-only |

---

## Seed Data (from OPCR CSV)
- 3 offices: Administrative Office, Academic Office, OSAS
- 94+ services with SLA targets parsed from the CSV file
- 3 demo users per role per office for testing

---

## Verification Checklist
- [ ] Login with Staff token → can only see own office data
- [ ] Login with Subsystem Admin → sees all transactions, SLA flags
- [ ] Login with OPCR Evaluator → read-only access, no create/edit buttons
- [ ] Create transaction → time_in auto-populated, status = Pending
- [ ] Set status → In Progress → Completed → time_out auto-set
- [ ] Set documentary_status = Incomplete → processing time paused
- [ ] SLA badge shows Compliant / Non-Compliant after completion
- [ ] Dashboard highlights red for is_sla_breached = true
- [ ] Cross-office action attempt → blocked with error toast
