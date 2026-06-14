# EMS NestJS Microservices Architecture Plan
## Capstone — Production-Grade Backend Migration (Revised)

---

## 1. Context

The EMS is a React + Vite frontend with an **in-memory mock API** (`src/api/mockApi.ts`) standing in for a real backend. The database schema, migrations, triggers, and RLS policies are fully designed in `database/`. This plan migrates the simulated logic into a real **NestJS monorepo backend** without breaking the existing frontend or database.

**Architecture decisions (final):**
- ✅ NestJS monorepo (`apps/` + `packages/`)
- ✅ Single shared PostgreSQL — existing RLS, triggers, functions untouched
- ✅ API Gateway as single REST entry point
- ✅ Docker Compose for all services
- ✅ HTTP REST for service-to-service communication (not NestJS TCP)
- ✅ EMS does NOT own authentication — JWT is issued by ARMS, EMS only validates
- ✅ Kafka added in Phase 4 only — after core HTTP services are verified

---

## 2. Correction #1 — Remove EMS Login Ownership

**Before (wrong):**
```
POST /api/auth/login  →  user-management-service
```

**After (correct):**
```
ARMS (external)  →  issues JWT
React             →  receives JWT, stores in localStorage
API Gateway       →  validates JWT signature on every request
                  →  extracts claims (sub, role, office_id, office_code)
                  →  passes user context to downstream services via headers
```

**Replacement functions in `src/api/realApi.ts`:**
- `loginApi()` is **kept in `mockApi.ts` only** (dev convenience)
- `realApi.ts` exposes: `validateTokenApi()` → `GET /api/auth/me` (returns current user from JWT claims)
- All other API calls simply attach `Authorization: Bearer <token>` via `apiClient` interceptor (already configured in `src/api/client.ts`)

**API Gateway auth module responsibilities:**
- Verify JWT signature against ARMS public key (or HMAC secret in dev)
- Reject 401 if expired or invalid
- Attach `x-user-id`, `x-office-id`, `x-user-role` request headers for downstream services
- `GET /api/auth/me` → return decoded JWT claims as `User` object (no DB call needed)

---

## 3. Correction #2 — Phased Kafka (Not Day 1)

Kafka is added **only in Phase 4** after all HTTP services are working.

**Phase 1–3:** Direct HTTP calls only. `dispatchToARMS()` stub remains a `console.debug()` line, exactly as it is in `mockApi.ts` today.

**Phase 4 Kafka topics (deferred):**

| Topic | Producer | Consumers |
|---|---|---|
| `ems.transaction.created` | service-transaction | audit-log |
| `ems.transaction.assigned` | service-transaction | audit-log |
| `ems.transaction.status_changed` | service-transaction | audit-log, time-tracking |
| `ems.transaction.completed` | service-transaction | time-tracking, performance |
| `ems.transaction.documentary_changed` | service-transaction | audit-log |
| `ems.sla.computation_completed` | time-tracking | service-transaction, performance |
| `ems.audit.log_created` | audit-log | (ARMS stub → real in Sprint 4) |
| `ems.performance.metrics_updated` | performance | dashboard |

---

## 4. Correction #3 — HTTP REST Between Services (Not TCP)

**Before (wrong):** NestJS TCP microservice transport (`@MessagePattern`, `ClientProxy`)

**After (correct):** Plain HTTP REST between services

```
React (src/)
    │ REST (JWT Bearer)
    ↓
api-gateway :3001
    │ HTTP GET /users              → user-management-service :3002
    │ HTTP GET/POST /transactions  → service-transaction-service :3003
    │ HTTP GET /transactions/:id/history → audit-log-service :3006
    │ HTTP GET /audit-log          → audit-log-service :3006
    └ HTTP GET /dashboard/stats    → dashboard-reporting-service :3007
```

Each downstream service is a **standard NestJS HTTP app** (no `@nestjs/microservices` TCP). The API Gateway uses `HttpService` (axios wrapper) to proxy requests. This means:
- All endpoints are debuggable with curl / Postman
- Services are independently deployable and testable
- Language-agnostic in the future (Java, Go, Python can replace any service)
- Capstone defense: everyone understands `GET /transactions`

---

## 5. Target Monorepo Structure

```
EMS_PROJECT/                        ← /workspace/thread (project root)
├── src/                            ← existing React app (UNCHANGED)
│   └── api/
│       ├── mockApi.ts              ← keep (dev convenience, unchanged)
│       ├── realApi.ts              ← NEW: real HTTP via apiClient
│       └── index.ts                ← NEW: toggle mock vs real
├── apps/
│   ├── api-gateway/                port 3001
│   ├── user-management-service/    port 3002
│   ├── service-transaction-service/ port 3003
│   ├── time-tracking-sla-service/  port 3004
│   ├── performance-monitoring-service/ port 3005
│   ├── audit-log-service/          port 3006
│   └── dashboard-reporting-service/ port 3007
├── packages/
│   ├── dto/                        shared DTOs
│   └── types/                      shared TypeScript interfaces
├── database/                       ← existing migrations (DO NOT TOUCH)
├── docker-compose.yml              NEW
├── pnpm-workspace.yaml             NEW
└── package.json                    UPDATE: workspaces root
```

> **`packages/kafka/` is deferred to Phase 4** — not created in Phase 1–3.

---

## 6. Service Ownership Matrix

| Table | Owning Service | Read-Access Services |
|---|---|---|
| `offices` | user-management-service | all |
| `users` | user-management-service | service-transaction, audit-log |
| `services` | service-transaction-service | dashboard, performance |
| `transactions` | service-transaction-service | audit-log, dashboard, performance |
| `transaction_status_history` | audit-log-service | performance, dashboard |
| `pss_computation_queue` | time-tracking-sla-service | dashboard |

**RLS enforcement:** Each service sets PostgreSQL session variables per request:
```sql
SET LOCAL ems.current_office_id = '<uuid>';
SET LOCAL ems.current_role      = '<role>';
SET LOCAL ems.acting_user_id    = '<uuid>';
```
These are extracted from `x-user-*` headers injected by the API Gateway.

---

## 7. API Endpoint Mapping

| `mockApi.ts` Function | Method | API GW Route | Target Service |
|---|---|---|---|
| `loginApi` (mock-only) | — | — | ARMS (external) |
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
| *(new)* | GET | `/api/auth/me` | api-gateway (JWT decode only) |

---

## 8. Phased Implementation Strategy

### Phase 1 — Core HTTP (Implement First)
**Goal:** React frontend → API Gateway → 3 services → PostgreSQL. All Sprint 3 features verified.

Services:
- `api-gateway` — JWT validation, HTTP proxy, `/api/auth/me`
- `user-management-service` — `GET /users`, `fn_sync_user()`
- `service-transaction-service` — full transaction CRUD + service catalog

Frontend changes:
- `src/api/realApi.ts` — 12 functions using `apiClient`
- `src/api/index.ts` — toggle via `window.__EMS_USE_REAL_API__`
- Update all page imports from `@/api/mockApi` → `@/api`

---

### Phase 2 — Audit & SLA
**Goal:** History endpoints live; SLA computation queue working.

Services:
- `audit-log-service` — `GET /transactions/:id/history`, `GET /audit-log`, writes `transaction_status_history`
- `time-tracking-sla-service` — SLA computation queue, `fn_classify_sla()`, `pss_computation_queue` management

service-transaction-service calls audit-log-service via HTTP after each mutation (replaces `dispatchToARMS()` stub).

---

### Phase 3 — Performance & Dashboard
**Goal:** Dashboard stats and SLA review powered by real DB functions.

Services:
- `performance-monitoring-service` — `fn_get_sla_compliance_by_service()`, trend data
- `dashboard-reporting-service` — `fn_get_office_stats()`, KPI aggregation

---

### Phase 4 — Kafka Integration
**Goal:** Event-driven async flow for audit and SLA.

- Add `packages/kafka/` with KafkaJS module and event contracts
- service-transaction-service emits Kafka events instead of direct HTTP to audit-log
- audit-log-service and time-tracking-sla-service become Kafka consumers
- ARMS dispatch: real HTTP POST to ARMS `POST /audit/ingest`
- docker-compose adds: `zookeeper`, `kafka`

---

## 9. Files to Create — Phase 1 (Priority)

### Root Config
- `pnpm-workspace.yaml`
- `package.json` (root — workspaces only, no scripts)
- `docker-compose.yml` — Phase 1: postgres + 3 services; Phase 4: add kafka + zookeeper

### `packages/types/`
- `packages/types/src/index.ts` — copy of `src/types/index.ts`
- `packages/types/package.json`
- `packages/types/tsconfig.json`

### `packages/dto/`
- `packages/dto/src/transaction.dto.ts`
- `packages/dto/src/user.dto.ts`
- `packages/dto/src/auth.dto.ts`
- `packages/dto/src/dashboard.dto.ts`
- `packages/dto/src/audit.dto.ts`
- `packages/dto/package.json`
- `packages/dto/tsconfig.json`

### `apps/api-gateway/`
- `src/main.ts`
- `src/app.module.ts`
- `src/auth/jwt.strategy.ts` — validates ARMS JWT, extracts claims
- `src/auth/jwt.guard.ts`
- `src/auth/auth.controller.ts` — `GET /api/auth/me`
- `src/auth/auth.module.ts`
- `src/proxy/proxy.module.ts`
- `src/proxy/users.proxy.controller.ts` — proxies `/api/users` → user-svc
- `src/proxy/transactions.proxy.controller.ts` — proxies all `/api/transactions/*`
- `src/proxy/audit.proxy.controller.ts` — proxies `/api/audit-log` + history
- `src/proxy/dashboard.proxy.controller.ts` — proxies `/api/dashboard/stats`
- `src/common/rls-headers.interceptor.ts` — injects `x-user-*` headers
- `package.json`, `tsconfig.json`, `.env.example`

### `apps/user-management-service/`
- `src/main.ts`
- `src/app.module.ts`
- `src/database/database.module.ts` — PG pool, `setRlsContext()` helper
- `src/users/users.module.ts`
- `src/users/users.controller.ts` — `GET /users?officeId=`, `GET /users/:id`
- `src/users/users.service.ts` — `getUsers()`, `getUserById()`, `syncUserFromJwt()`
- `src/users/users.repository.ts` — SQL queries
- `src/offices/offices.controller.ts` — `GET /offices`
- `src/offices/offices.service.ts`
- `package.json`, `tsconfig.json`, `.env.example`

### `apps/service-transaction-service/`
- `src/main.ts`
- `src/app.module.ts`
- `src/database/database.module.ts`
- `src/services/services.module.ts`
- `src/services/services.controller.ts` — `GET /services?officeId=`
- `src/services/services.service.ts`
- `src/services/services.repository.ts`
- `src/transactions/transactions.module.ts`
- `src/transactions/transactions.controller.ts` — all 6 transaction endpoints
- `src/transactions/transactions.service.ts` — ports all logic from `mockApi.ts`
- `src/transactions/transactions.repository.ts` — raw SQL + RLS context
- `src/transactions/audit-dispatch.service.ts` — HTTP call to audit-log-service (replaces `dispatchToARMS()`)
- `package.json`, `tsconfig.json`, `.env.example`

### Frontend
- `src/api/realApi.ts`
- `src/api/index.ts`
- Update `src/auth/AuthContext.tsx` imports
- Update all 6 pages/components that import from `@/api/mockApi`

---

## 10. Files to Create — Phase 2

### `apps/audit-log-service/`
- `src/main.ts`, `src/app.module.ts`
- `src/database/database.module.ts`
- `src/audit/audit.module.ts`
- `src/audit/audit.controller.ts` — `GET /history/:transactionId`, `GET /audit-log`
- `src/audit/audit.service.ts` — writes history, reads filtered log
- `src/audit/audit.repository.ts`
- `src/audit/arms-dispatch.service.ts` — stub POST to ARMS
- `package.json`, `tsconfig.json`, `.env.example`

### `apps/time-tracking-sla-service/`
- `src/main.ts`, `src/app.module.ts`
- `src/database/database.module.ts`
- `src/sla/sla.module.ts`
- `src/sla/sla.controller.ts` — `POST /sla/compute`, `GET /sla/queue`
- `src/sla/sla.service.ts` — calls `fn_classify_sla()`, manages `pss_computation_queue`
- `src/sla/sla.repository.ts`
- `src/pss/pss.client.ts` — PSS HTTP stub (Sprint 4)
- `package.json`, `tsconfig.json`, `.env.example`

---

## 11. Files to Create — Phase 3

### `apps/performance-monitoring-service/`
- `src/main.ts`, `src/app.module.ts`
- `src/database/database.module.ts`
- `src/performance/performance.module.ts`
- `src/performance/performance.controller.ts` — `GET /performance/by-service`, `GET /performance/trend`
- `src/performance/performance.service.ts` — calls `fn_get_sla_compliance_by_service()`
- `src/performance/performance.repository.ts`
- `package.json`, `tsconfig.json`, `.env.example`

### `apps/dashboard-reporting-service/`
- `src/main.ts`, `src/app.module.ts`
- `src/database/database.module.ts`
- `src/dashboard/dashboard.module.ts`
- `src/dashboard/dashboard.controller.ts` — `GET /dashboard/stats`
- `src/dashboard/dashboard.service.ts` — calls `fn_get_office_stats()`
- `src/dashboard/dashboard.repository.ts`
- `package.json`, `tsconfig.json`, `.env.example`

---

## 12. Files to Create — Phase 4 (Kafka)

### `packages/kafka/`
- `src/events.ts` — all Kafka event interfaces
- `src/kafka.module.ts` — shared `KafkaModule` with `forRoot()`
- `src/kafka.service.ts` — `produce(topic, payload)` wrapper
- `package.json`, `tsconfig.json`

### Update existing services
- service-transaction-service: swap `AuditDispatchService` HTTP calls → Kafka `produce()`
- audit-log-service: add `@EventPattern()` Kafka consumers
- time-tracking-sla-service: add `@EventPattern()` for `transaction.completed`
- docker-compose: add `zookeeper` + `kafka` services

---

## 13. Key Existing Code Reused

| Existing File | Reused In |
|---|---|
| `database/01–06_*.sql` | Reference only — no recreation |
| `fn_classify_sla()` | time-tracking-sla-service → called via `PERFORM fn_classify_sla($1)` |
| `fn_get_office_stats()` | dashboard-reporting-service → `SELECT * FROM fn_get_office_stats($1)` |
| `fn_get_sla_compliance_by_service()` | performance-monitoring-service |
| `fn_sync_user()` | user-management-service → `SELECT fn_sync_user($1,$2,$3,$4,$5)` |
| `src/api/client.ts` | Reused in `realApi.ts` — already configured for `localhost:3001` |
| `src/types/index.ts` | Copied to `packages/types/src/index.ts` |
| `src/utils/slaUtils.ts` | Logic mirrored in time-tracking service |

---

## 14. NestJS Packages Required (all services)

```json
{
  "@nestjs/common": "^10",
  "@nestjs/core": "^10",
  "@nestjs/platform-express": "^10",
  "@nestjs/axios": "^3",
  "@nestjs/jwt": "^10",
  "@nestjs/passport": "^10",
  "@nestjs/throttler": "^5",
  "passport": "^0.6",
  "passport-jwt": "^4",
  "pg": "^8",
  "reflect-metadata": "^0.1",
  "rxjs": "^7",
  "class-validator": "^0.14",
  "class-transformer": "^0.5"
}
```
Phase 4 only: `kafkajs: ^2`

---

## 15. Capstone Adviser Scorecard (Post-Corrections)

| Area | Verdict |
|---|---|
| Service Boundaries | ✅ Excellent |
| Docker Compose | ✅ Excellent |
| Shared PostgreSQL + RLS | ✅ Excellent |
| API Gateway | ✅ Correct |
| ARMS JWT (EMS does not own auth) | ✅ Corrected |
| Service-to-service HTTP REST | ✅ Corrected |
| Kafka deferred to Phase 4 | ✅ Corrected |
| Phased implementation | ✅ Risk-controlled |

---

## 16. Verification Checklist

### Phase 1
- [ ] `docker-compose up` starts postgres + 3 NestJS services
- [ ] `GET /api/auth/me` with valid JWT returns `User` object
- [ ] `GET /api/transactions` with office-scoped JWT returns correct list
- [ ] `POST /api/transactions` creates row in DB, returns `Transaction`
- [ ] `PATCH /api/transactions/:id/status` → `completed` sets `is_locked = true`
- [ ] React frontend with `window.__EMS_USE_REAL_API__ = true` loads correctly

### Phase 2
- [ ] `GET /api/transactions/:id/history` returns audit entries from DB
- [ ] `GET /api/audit-log` returns filtered, paginated history
- [ ] `PATCH status → completed` triggers SLA computation via time-tracking-svc
- [ ] `pss_computation_queue` row created with `status = 'queued'`

### Phase 3
- [ ] `GET /api/dashboard/stats` returns `DashboardStats` from `fn_get_office_stats()`
- [ ] SLA review page loads service breakdown from performance-monitoring-svc

### Phase 4
- [ ] `transaction.created` Kafka message consumed by audit-log-service
- [ ] audit-log-service writes `transaction_status_history` from Kafka event
