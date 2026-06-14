# EMS NestJS Microservices Architecture Plan
## Capstone — Production-Grade Backend Migration

---

## 1. Context

The EMS is currently a React + Vite frontend with an **in-memory mock API** (`src/api/mockApi.ts`) standing in for a real backend. The database schema, migrations, triggers, and RLS policies are fully designed and documented in `database/`. This plan migrates the simulated logic into a real **NestJS monorepo backend** without breaking the existing frontend or database migrations.

**Decisions confirmed:**
- Full working NestJS code (all 7 services)
- Communication: Kafka (async events) + NestJS TCP transport (sync service-to-service) + REST (frontend → API Gateway)
- Single shared PostgreSQL database — existing RLS policies enforced via `SET LOCAL ems.*` config vars
- Frontend: `src/api/mockApi.ts` kept; new `src/api/realApi.ts` created; `src/api/index.ts` toggles between them

---

## 2. Target Monorepo Structure

```
EMS_PROJECT/                        ← /workspace/thread (project root)
├── src/                            ← existing React app (UNCHANGED)
│   └── api/
│       ├── mockApi.ts              ← keep (dev only)
│       ├── realApi.ts              ← NEW: real HTTP calls via apiClient
│       └── index.ts                ← NEW: exports from mock or real
├── apps/
│   ├── api-gateway/                port 3001 — single entry point
│   ├── user-management-service/    port 3002 — EMS-001,002,003
│   ├── service-transaction-service/ port 3003 — EMS-004,005,006,007
│   ├── time-tracking-sla-service/  port 3004 — EMS-008,009,010,011,012
│   ├── performance-monitoring-service/ port 3005 — EMS-016,017,018,019
│   ├── audit-log-service/          port 3006 — EMS-015,024,025,026
│   └── dashboard-reporting-service/ port 3007 — EMS-020,021,022,023
├── packages/
│   ├── dto/                        shared CreateTransactionDto, UpdateStatusDto, etc.
│   ├── kafka/                      Kafka producer/consumer base + event contracts
│   └── types/                      shared TypeScript interfaces (mirrors src/types/index.ts)
├── database/                       ← existing migrations (DO NOT TOUCH)
├── docker-compose.yml              NEW
└── package.json                    UPDATE: pnpm workspaces root
```

---

## 3. Service Ownership Matrix

| Table | Owning Service | Read-Access Services |
|---|---|---|
| `offices` | user-management-service | all services (via API GW) |
| `users` | user-management-service | service-transaction, audit-log |
| `services` | service-transaction-service | dashboard, performance |
| `transactions` | service-transaction-service | time-tracking, audit-log, dashboard, performance |
| `transaction_status_history` | audit-log-service | performance, dashboard |
| `pss_computation_queue` | time-tracking-sla-service | dashboard |

**RLS enforcement**: Each service sets `SET LOCAL ems.current_office_id`, `ems.current_role`, `ems.acting_user_id` from JWT claims before every DB operation.

---

## 4. API Endpoint Mapping (Frontend → API GW → Service)

| `mockApi.ts` Function | Method | API GW Route | Target Service |
|---|---|---|---|
| `loginApi` | POST | `/api/auth/login` | api-gateway (JWT validation only) |
| `getUsersApi` | GET | `/api/users` | user-management-service |
| `getServicesApi` | GET | `/api/services` | service-transaction-service |
| `getTransactionsApi` | GET | `/api/transactions` | service-transaction-service |
| `getTransactionApi` | GET | `/api/transactions/:id` | service-transaction-service |
| `createTransactionApi` | POST | `/api/transactions` | service-transaction-service |
| `assignTransactionApi` | PATCH | `/api/transactions/:id/assignment` | service-transaction-service |
| `updateTransactionStatusApi` | PATCH | `/api/transactions/:id/status` | service-transaction-service |
| `updateDocumentaryStatusApi` | PATCH | `/api/transactions/:id/documentary-status` | service-transaction-service |
| `getTransactionHistoryApi` | GET | `/api/transactions/:id/history` | audit-log-service |
| `getAuditLogApi` | GET | `/api/audit-log` | audit-log-service |
| `getDashboardStatsApi` | GET | `/api/dashboard/stats` | dashboard-reporting-service |

---

## 5. Kafka Event Contracts

All events live in `packages/kafka/src/events.ts`.

| Event Topic | Producer | Consumers |
|---|---|---|
| `ems.transaction.created` | service-transaction | audit-log, time-tracking |
| `ems.transaction.assigned` | service-transaction | audit-log |
| `ems.transaction.status_changed` | service-transaction | audit-log, time-tracking |
| `ems.transaction.completed` | service-transaction | audit-log, time-tracking, performance |
| `ems.transaction.documentary_changed` | service-transaction | audit-log |
| `ems.sla.computation_requested` | time-tracking | (PSS stub) |
| `ems.sla.computation_completed` | time-tracking | service-transaction, performance |
| `ems.audit.log_created` | audit-log | (ARMS stub) |
| `ems.performance.metrics_updated` | performance-monitoring | dashboard |

---

## 6. Database Strategy

- **Single PostgreSQL instance** — all services share one connection string
- Each service sets `SET LOCAL` config vars per request for RLS:
  ```sql
  SET LOCAL ems.current_office_id = '<office_uuid>';
  SET LOCAL ems.current_role = '<role>';
  SET LOCAL ems.acting_user_id = '<user_uuid>';
  ```
- Reuse existing `fn_compute_processing_time()`, `fn_classify_sla()`, `fn_sync_user()`, `fn_get_office_stats()`
- **No new migrations needed** — all schema already exists in `01–06` files

---

## 7. Communication Architecture

```
React Frontend (src/)
        |
        | REST HTTP (JWT Bearer)
        ↓
  api-gateway :3001
   (JWT guard, rate-limit, route proxy)
        |
        | NestJS TCP Transport (internal)
        ├──→ user-management-service :3002
        ├──→ service-transaction-service :3003 ──→ Kafka ──→ audit-log-service :3006
        │                                              └──→ time-tracking-sla-service :3004
        ├──→ time-tracking-sla-service :3004 (SLA queue)
        ├──→ audit-log-service :3006
        └──→ dashboard-reporting-service :3007 ←── performance-monitoring-service :3005
```

---

## 8. Files to Create

### Root Level
- `package.json` — UPDATE: add `workspaces`, remove scripts (moved to apps)
- `pnpm-workspace.yaml` — NEW: `packages: ['apps/*', 'packages/*']`
- `docker-compose.yml` — NEW: PostgreSQL, Kafka, Zookeeper, all 7 NestJS services

---

### `packages/types/` — Shared TypeScript Interfaces
- `packages/types/src/index.ts` — mirrors `src/types/index.ts` exactly (User, Transaction, Service, etc.)
- `packages/types/package.json`
- `packages/types/tsconfig.json`

---

### `packages/dto/` — Shared Data Transfer Objects
- `packages/dto/src/auth.dto.ts` — `LoginDto`, `LoginResponseDto`
- `packages/dto/src/user.dto.ts` — `CreateUserDto`, `SyncUserDto`
- `packages/dto/src/transaction.dto.ts` — `CreateTransactionDto`, `UpdateTransactionStatusDto`, `UpdateDocumentaryStatusDto`, `AssignTransactionDto`
- `packages/dto/src/dashboard.dto.ts` — `DashboardStatsDto`
- `packages/dto/src/audit.dto.ts` — `AuditLogFilterDto`
- `packages/dto/package.json`
- `packages/dto/tsconfig.json`

---

### `packages/kafka/` — Kafka Producers/Consumers + Event Contracts
- `packages/kafka/src/events.ts` — all Kafka event interfaces
- `packages/kafka/src/kafka.module.ts` — shared `KafkaModule` (configurable)
- `packages/kafka/src/kafka.service.ts` — `produce()` wrapper
- `packages/kafka/package.json`
- `packages/kafka/tsconfig.json`

---

### `apps/api-gateway/`
- `apps/api-gateway/src/main.ts`
- `apps/api-gateway/src/app.module.ts`
- `apps/api-gateway/src/auth/jwt.strategy.ts` — validates ARMS-issued JWTs
- `apps/api-gateway/src/auth/jwt.guard.ts`
- `apps/api-gateway/src/auth/auth.module.ts`
- `apps/api-gateway/src/proxy/gateway.controller.ts` — proxies every route to appropriate service via TCP
- `apps/api-gateway/src/proxy/gateway.module.ts`
- `apps/api-gateway/src/common/rate-limit.guard.ts`
- `apps/api-gateway/package.json`
- `apps/api-gateway/tsconfig.json`
- `apps/api-gateway/.env.example`

---

### `apps/user-management-service/`
- `apps/user-management-service/src/main.ts` — hybrid (TCP + HTTP)
- `apps/user-management-service/src/app.module.ts`
- `apps/user-management-service/src/users/users.module.ts`
- `apps/user-management-service/src/users/users.controller.ts` — TCP message patterns
- `apps/user-management-service/src/users/users.service.ts` — `getUsers()`, `syncUser()`, `getUserById()`
- `apps/user-management-service/src/users/users.repository.ts` — raw SQL via `pg` pool + RLS context
- `apps/user-management-service/src/offices/offices.module.ts`
- `apps/user-management-service/src/offices/offices.service.ts`
- `apps/user-management-service/src/database/database.module.ts` — shared PG pool
- `apps/user-management-service/package.json`
- `apps/user-management-service/tsconfig.json`
- `apps/user-management-service/.env.example`

---

### `apps/service-transaction-service/`
- `apps/service-transaction-service/src/main.ts`
- `apps/service-transaction-service/src/app.module.ts`
- `apps/service-transaction-service/src/transactions/transactions.module.ts`
- `apps/service-transaction-service/src/transactions/transactions.controller.ts` — TCP message patterns
- `apps/service-transaction-service/src/transactions/transactions.service.ts`
  - Ports: `createTransaction()`, `assignTransaction()`, `updateStatus()`, `updateDocumentary()`, `getTransaction()`, `listTransactions()`
  - Each mutating method emits Kafka event after DB write
- `apps/service-transaction-service/src/transactions/transactions.repository.ts` — SQL queries, sets RLS vars
- `apps/service-transaction-service/src/services/services.module.ts`
- `apps/service-transaction-service/src/services/services.service.ts` — `getServicesByOffice()`
- `apps/service-transaction-service/package.json`
- `apps/service-transaction-service/tsconfig.json`
- `apps/service-transaction-service/.env.example`

---

### `apps/time-tracking-sla-service/`
- `apps/time-tracking-sla-service/src/main.ts`
- `apps/time-tracking-sla-service/src/app.module.ts`
- `apps/time-tracking-sla-service/src/sla/sla.module.ts`
- `apps/time-tracking-sla-service/src/sla/sla.controller.ts` — TCP + Kafka consumer
- `apps/time-tracking-sla-service/src/sla/sla.service.ts`
  - Consumes `ems.transaction.completed` → triggers `fn_classify_sla()`
  - Manages `pss_computation_queue`: queued → submitted → received | failed
  - Retry logic with exponential backoff
  - Emits `ems.sla.computation_completed`
- `apps/time-tracking-sla-service/src/sla/sla.repository.ts`
- `apps/time-tracking-sla-service/src/pss/pss.client.ts` — PSS HTTP stub (Sprint 4)
- `apps/time-tracking-sla-service/package.json`
- `apps/time-tracking-sla-service/tsconfig.json`

---

### `apps/performance-monitoring-service/`
- `apps/performance-monitoring-service/src/main.ts`
- `apps/performance-monitoring-service/src/app.module.ts`
- `apps/performance-monitoring-service/src/performance/performance.module.ts`
- `apps/performance-monitoring-service/src/performance/performance.controller.ts` — TCP
- `apps/performance-monitoring-service/src/performance/performance.service.ts`
  - Consumes `ems.transaction.completed` and `ems.sla.computation_completed`
  - Calls `fn_get_sla_compliance_by_service()` and `fn_get_office_stats()`
  - Emits `ems.performance.metrics_updated`
- `apps/performance-monitoring-service/src/performance/performance.repository.ts`
- `apps/performance-monitoring-service/package.json`
- `apps/performance-monitoring-service/tsconfig.json`

---

### `apps/audit-log-service/`
- `apps/audit-log-service/src/main.ts`
- `apps/audit-log-service/src/app.module.ts`
- `apps/audit-log-service/src/audit/audit.module.ts`
- `apps/audit-log-service/src/audit/audit.controller.ts` — TCP + Kafka consumer
- `apps/audit-log-service/src/audit/audit.service.ts`
  - Consumes all `ems.transaction.*` Kafka events → inserts `transaction_status_history` rows
  - `getHistory(transactionId)` → returns audit timeline
  - `getAuditLog(officeId, filters)` → filtered log view
  - `dispatchToARMS()` → stub HTTP POST to ARMS (Sprint 4)
- `apps/audit-log-service/src/audit/audit.repository.ts`
- `apps/audit-log-service/package.json`
- `apps/audit-log-service/tsconfig.json`

---

### `apps/dashboard-reporting-service/`
- `apps/dashboard-reporting-service/src/main.ts`
- `apps/dashboard-reporting-service/src/app.module.ts`
- `apps/dashboard-reporting-service/src/dashboard/dashboard.module.ts`
- `apps/dashboard-reporting-service/src/dashboard/dashboard.controller.ts` — TCP
- `apps/dashboard-reporting-service/src/dashboard/dashboard.service.ts`
  - Calls `fn_get_office_stats()` and `fn_get_sla_compliance_by_service()`
  - Consumes `ems.performance.metrics_updated`
- `apps/dashboard-reporting-service/src/dashboard/dashboard.repository.ts`
- `apps/dashboard-reporting-service/package.json`
- `apps/dashboard-reporting-service/tsconfig.json`

---

### Frontend Changes (`src/api/`)
- `src/api/realApi.ts` — NEW: identical function signatures as `mockApi.ts`, using `apiClient` for real HTTP
- `src/api/index.ts` — NEW: toggle export (mock vs real based on `window.__EMS_USE_REAL_API__`)
- Update `src/auth/AuthContext.tsx` — import from `@/api/index` instead of `@/api/mockApi`
- Update all pages to import from `@/api` instead of `@/api/mockApi`

---

## 9. Docker Compose Services

```yaml
services:
  postgres:       image: postgres:15, port 5432
  zookeeper:      image: confluentinc/cp-zookeeper:7.4.0
  kafka:          image: confluentinc/cp-kafka:7.4.0, port 9092
  api-gateway:    build: ./apps/api-gateway, port 3001
  user-svc:       build: ./apps/user-management-service, port 3002
  transaction-svc: build: ./apps/service-transaction-service, port 3003
  time-tracking-svc: build: ./apps/time-tracking-sla-service, port 3004
  performance-svc: build: ./apps/performance-monitoring-service, port 3005
  audit-svc:      build: ./apps/audit-log-service, port 3006
  dashboard-svc:  build: ./apps/dashboard-reporting-service, port 3007
```

---

## 10. Implementation Order

1. **`packages/types`** — copy types from `src/types/index.ts`
2. **`packages/dto`** — extract DTOs from `src/types/index.ts`
3. **`packages/kafka`** — event contracts, KafkaModule
4. **Root** — `pnpm-workspace.yaml`, update `package.json`, `docker-compose.yml`
5. **`apps/api-gateway`** — JWT guard, TCP proxy controller
6. **`apps/user-management-service`** — users + offices, PG pool, RLS context helper
7. **`apps/service-transaction-service`** — full transaction CRUD + Kafka produces
8. **`apps/audit-log-service`** — Kafka consumers + history/audit-log queries
9. **`apps/time-tracking-sla-service`** — Kafka consumer + SLA computation queue
10. **`apps/performance-monitoring-service`** — metrics aggregation
11. **`apps/dashboard-reporting-service`** — stats + reporting
12. **Frontend** — `src/api/realApi.ts` + `src/api/index.ts` + update imports

---

## 11. Key Reuse Points

| Existing File | Reused In |
|---|---|
| `database/01_schema.sql` | Reference only (no recreation) |
| `database/02_functions.sql` | Called by: time-tracking (`fn_classify_sla`), dashboard (`fn_get_office_stats`, `fn_get_sla_compliance_by_service`), user-management (`fn_sync_user`) |
| `database/03_triggers.sql` | Auto-invoked by DB on INSERT/UPDATE — no NestJS code needed |
| `src/types/index.ts` | Copied to `packages/types/src/index.ts` |
| `src/api/client.ts` | Reused in `src/api/realApi.ts` (already configured for localhost:3001) |
| `src/utils/slaUtils.ts` | Mirrored logic in `time-tracking-sla-service/sla.service.ts` |

---

## 12. Verification Checklist

- [ ] `docker-compose up` starts all 7 services and Kafka
- [ ] `POST /api/auth/login` with `admin@ems.ph` / `admin123` returns JWT
- [ ] `GET /api/transactions` with valid JWT returns office-scoped list
- [ ] `POST /api/transactions` creates a transaction, emits `ems.transaction.created` Kafka event
- [ ] audit-log-service consumes `ems.transaction.created` and writes `transaction_status_history`
- [ ] `PATCH /api/transactions/:id/status` with `completed` triggers time-tracking SLA computation
- [ ] Completed transaction returns `is_locked: true` on subsequent GET
- [ ] `GET /api/audit-log` returns filtered history for the office
- [ ] `GET /api/dashboard/stats` returns `DashboardStats` with correct counts
- [ ] Frontend toggle (`window.__EMS_USE_REAL_API__ = true`) switches from mockApi to realApi

---

## 13. NestJS Packages Required (per service)

```json
{
  "@nestjs/common": "^10",
  "@nestjs/core": "^10",
  "@nestjs/microservices": "^10",
  "@nestjs/platform-express": "^10",
  "@nestjs/jwt": "^10",
  "@nestjs/passport": "^10",
  "passport": "^0.6",
  "passport-jwt": "^4",
  "kafkajs": "^2",
  "pg": "^8",
  "reflect-metadata": "^0.1",
  "rxjs": "^7",
  "class-validator": "^0.14",
  "class-transformer": "^0.5",
  "@nestjs/throttler": "^5"
}
```

---

## 14. Total Files to Create/Modify

| Category | Count |
|---|---|
| Root config files | 3 |
| packages/* | 11 |
| apps/api-gateway | 9 |
| apps/user-management-service | 10 |
| apps/service-transaction-service | 10 |
| apps/time-tracking-sla-service | 8 |
| apps/performance-monitoring-service | 7 |
| apps/audit-log-service | 8 |
| apps/dashboard-reporting-service | 7 |
| Frontend refactor | 4 |
| **Total** | **~77 files** |
