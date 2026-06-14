# EMS NestJS Microservices Architecture Plan
## Capstone — Production-Grade Backend Migration (Revised + Contract Integration)

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
- ✅ PSS/ARMS integration contracts incorporated (see Section 3)

> **Note on contract document:** `System_Integration_Contracts_PSS_EMS_ARMS.docx` was provided.
> The file is a DOCX (ZIP) whose internal XML could not be fully extracted in this environment.
> The contracts below are reconstructed from codebase references (`workingCalendar.ts`, `pss_computation_queue`, `mockApi.ts` stubs, `serviceConfig.ts`, `schema.sql` comments). The user should verify Section 3 against the actual document and flag any discrepancies.

---

## 2. Three Architecture Corrections (from prior revision)

### Correction #1 — Remove EMS Login Ownership
```
ARMS (external)  →  issues JWT
React             →  receives JWT, stores in localStorage
API Gateway       →  validates JWT signature on every request
                  →  extracts claims (sub, role, office_id, office_code)
                  →  passes user context downstream via x-user-* headers
```
- No `POST /api/auth/login` in EMS
- `GET /api/auth/me` → returns decoded JWT claims (no DB call)
- `loginApi()` stays in `mockApi.ts` only (dev convenience)

### Correction #2 — Phased Kafka (Phase 4 only)
Phase 1–3 use direct HTTP service calls. Kafka is introduced only after all HTTP flows are verified.

### Correction #3 — HTTP REST Between Services (not NestJS TCP)
API Gateway proxies via `HttpService` (axios). All services are standard NestJS HTTP apps, fully debuggable with curl/Postman.

---

## 3. System Integration Contracts — PSS / EMS / ARMS

### 3.1 ARMS → EMS (Authentication & User Sync)

**ARMS is the JWT issuer. EMS is a consumer/validator only.**

**JWT Claims (from `src/types/index.ts`):**
```typescript
{
  sub:         string   // ARMS user UUID (matches EMS users.id)
  name:        string
  email:       string
  role:        'subsystem_admin' | 'staff' | 'opcr_evaluator'
  office_id:   string   // UUID matching EMS offices.id
  office_code: 'ADMIN_OFFICE' | 'ACADEMIC_OFFICE' | 'OSAS'
  office_name: string
  iat:         number
  exp:         number   // 8-hour expiry
}
```

**EMS API Gateway responsibilities:**
- Verify signature against ARMS public key / HMAC secret
- On first valid JWT: call `fn_sync_user()` to upsert user into EMS `users` table
- Propagate `x-user-id`, `x-office-id`, `x-user-role` headers to all downstream services

**ARMS User Sync endpoint (EMS calls ARMS):**
```
GET  {ARMS_BASE_URL}/api/users/:id
→ Returns full User profile if needed (supplementary to JWT claims)
```

---

### 3.2 EMS → ARMS (Audit Event Dispatch)

**After each significant EMS operation, an audit event is dispatched to ARMS.**

**ARMS Audit Ingest Endpoint:**
```
POST {ARMS_BASE_URL}/api/audit/ingest
Authorization: Bearer {EMS_SERVICE_TOKEN}
Content-Type: application/json

{
  "source":         "EMS",
  "transaction_id": "uuid",
  "action_type":    "CREATE | STATUS_CHANGE | ASSIGNMENT | DOCUMENTARY_CHANGE | REMARKS_UPDATE",
  "actor_id":       "uuid",
  "actor_name":     "string",
  "office_id":      "uuid",
  "old_value":      "string | null",
  "new_value":      "string | null",
  "timestamp":      "ISO8601",
  "metadata": {
    "service_name": "string",
    "client_name":  "string"
  }
}
→ 202 Accepted (fire-and-forget)
```

**Current state:** `dispatchToARMS()` in `mockApi.ts` is a `console.debug()` stub.
**Phase 2:** `apps/audit-log-service/src/audit/arms-dispatch.service.ts` makes real HTTP call.
**Phase 4:** Replaced by Kafka topic `ems.audit.log_created` → ARMS consumes it.

**New DB table: `arms_audit_dispatch_log`** (tracks dispatch status for retry):
```sql
-- Added in database/07_contract_schema.sql
CREATE TABLE arms_audit_dispatch_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id  UUID NOT NULL REFERENCES transactions(id),
    action_type     action_type NOT NULL,
    actor_id        UUID NOT NULL REFERENCES users(id),
    payload         JSONB NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | sent | failed
    attempts        INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    sent_at         TIMESTAMPTZ,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_arms_dispatch_status ON arms_audit_dispatch_log(status, created_at);
CREATE INDEX idx_arms_dispatch_txn ON arms_audit_dispatch_log(transaction_id);
```

---

### 3.3 PSS → EMS (Service Catalog & SLA Rules)

**PSS is the authoritative source for service definitions and SLA rules.
EMS caches PSS data locally for offline resilience.**

**PSS Endpoints consumed by EMS:**

```
GET  {PSS_BASE_URL}/api/services?officeCode={ACADEMIC_OFFICE|ADMIN_OFFICE|OSAS}
→ Returns list of Service objects with SLA targets
→ EMS caches this in the local `services` table (upsert on sync)

GET  {PSS_BASE_URL}/api/services/:id/intake-schema
→ Returns dynamic intake form schema for a service
→ EMS caches in `pss_intake_schema_cache` table

GET  {PSS_BASE_URL}/api/calendar?year=2026
→ Returns PH working calendar (holidays + working hours)
→ EMS caches in `pss_calendar_cache` table
→ Current fallback: `src/utils/workingCalendar.ts` (hardcoded for 2026)
```

**PSS Offline Fallback (EMS-004):**
- If PSS is unavailable: use cached `services` table data
- Display banner: "Using cached service data — PSS offline"
- Log sync failure in `pss_sync_log`

**New DB table: `pss_sync_log`** (tracks PSS cache refresh history):
```sql
CREATE TABLE pss_sync_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type       VARCHAR(50) NOT NULL,  -- 'services' | 'calendar' | 'intake_schema'
    office_code     office_code,
    status          VARCHAR(20) NOT NULL,  -- 'success' | 'failed' | 'partial'
    records_synced  INTEGER,
    error_message   TEXT,
    synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**New DB table: `pss_intake_schema_cache`** (caches PSS service intake schemas):
```sql
CREATE TABLE pss_intake_schema_cache (
    service_id      UUID PRIMARY KEY REFERENCES services(id),
    schema_json     JSONB NOT NULL,       -- intake form field definitions
    schema_version  VARCHAR(50),
    cached_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ
);
```

**New DB table: `pss_calendar_cache`** (caches PSS working calendar):
```sql
CREATE TABLE pss_calendar_cache (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calendar_year   INTEGER NOT NULL,
    holidays        JSONB NOT NULL,       -- array of date strings
    working_hours   JSONB NOT NULL,       -- {start: "08:00", end: "17:00", days: [...]}
    cached_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (calendar_year)
);
```

---

### 3.4 EMS → PSS (SLA Computation Request)

**After transaction completion, EMS submits computation request to PSS.**

**PSS SLA Computation Endpoint:**
```
POST {PSS_BASE_URL}/api/sla/compute
Authorization: Bearer {EMS_SERVICE_TOKEN}
Content-Type: application/json

{
  "transaction_id":       "uuid",
  "service_id":           "uuid",
  "office_code":          "ACADEMIC_OFFICE",
  "time_in":              "ISO8601",
  "time_out":             "ISO8601",
  "duration_seconds":     1320,
  "sla_target_seconds":   1080
}

→ 200 OK (synchronous, or 202 Accepted + webhook callback)
{
  "transaction_id": "uuid",
  "sla_status":     "compliant | non_compliant",
  "is_breached":    false,
  "computed_at":    "ISO8601"
}
```

**Current state:** `fn_classify_sla()` in PostgreSQL performs local computation.
`pss_computation_queue` table exists for retry logic.
**Sprint 4 (EMS-028):** Replace local fn_classify_sla() call with PSS HTTP request.

**PSS Webhook Callback (PSS → EMS async):**
```
POST {EMS_BASE_URL}/api/sla/result
Authorization: Bearer {PSS_SERVICE_TOKEN}

{
  "transaction_id": "uuid",
  "sla_status":     "compliant | non_compliant",
  "is_breached":    false,
  "computed_at":    "ISO8601"
}
→ 200 OK
```
New endpoint added to `apps/time-tracking-sla-service/src/sla/sla.controller.ts`
API Gateway proxies: `POST /api/sla/result` → time-tracking-sla-service

---

### 3.5 New API Endpoints Added by Contracts

| New Endpoint | Method | Source | Target Service |
|---|---|---|---|
| `/api/auth/me` | GET | Frontend | api-gateway (JWT decode) |
| `/api/pss/sync` | POST | admin trigger | service-transaction-service |
| `/api/pss/status` | GET | admin/dashboard | service-transaction-service |
| `/api/sla/result` | POST | PSS callback | time-tracking-sla-service |
| `/api/arms/dispatch-status` | GET | audit dashboard | audit-log-service |

---

## 4. Database Changes — `database/07_contract_schema.sql` (NEW)

This is the only new migration file. All existing `01–06_*.sql` files remain untouched.

```sql
-- =============================================================================
-- EMS Contract Schema — PSS / ARMS Integration Tables
-- Sprint 3+ : Supports PSS cache, ARMS audit dispatch, calendar cache
-- Run after : 06_sprint3_triggers.sql
-- =============================================================================

-- ─── PSS Sync Log ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pss_sync_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type       VARCHAR(50) NOT NULL,  -- 'services' | 'calendar' | 'intake_schema'
    office_code     office_code,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | success | failed
    records_synced  INTEGER DEFAULT 0,
    error_message   TEXT,
    synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pss_sync_type ON pss_sync_log(sync_type, synced_at DESC);

-- ─── PSS Intake Schema Cache ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pss_intake_schema_cache (
    service_id      UUID PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
    schema_json     JSONB NOT NULL,
    schema_version  VARCHAR(50),
    cached_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ GENERATED ALWAYS AS (cached_at + INTERVAL '24 hours') STORED
);

-- ─── PSS Calendar Cache ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pss_calendar_cache (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calendar_year   INTEGER NOT NULL,
    holidays        JSONB NOT NULL,
    working_hours   JSONB NOT NULL DEFAULT '{"start":"08:00","end":"17:00","days":[1,2,3,4,5]}',
    cached_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_calendar_year UNIQUE (calendar_year)
);

-- Seed with current hardcoded values from src/utils/workingCalendar.ts
INSERT INTO pss_calendar_cache (calendar_year, holidays, working_hours)
VALUES (
  2026,
  '["2026-01-01","2026-02-25","2026-04-02","2026-04-03","2026-04-09",
    "2026-05-01","2026-06-12","2026-08-21","2026-08-31","2026-10-31",
    "2026-11-01","2026-11-02","2026-11-30","2026-12-08","2026-12-24",
    "2026-12-25","2026-12-30","2026-12-31"]',
  '{"start":"08:00","end":"17:00","timezone":"Asia/Manila","days":[1,2,3,4,5]}'
)
ON CONFLICT (calendar_year) DO NOTHING;

-- ─── ARMS Audit Dispatch Log ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS arms_audit_dispatch_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id  UUID NOT NULL REFERENCES transactions(id),
    action_type     action_type NOT NULL,
    actor_id        UUID NOT NULL REFERENCES users(id),
    payload         JSONB NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | sent | failed
    attempts        INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    sent_at         TIMESTAMPTZ,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_arms_dispatch_status
  ON arms_audit_dispatch_log(status, created_at);
CREATE INDEX IF NOT EXISTS idx_arms_dispatch_txn
  ON arms_audit_dispatch_log(transaction_id);

-- ─── Extend services table: PSS origin tracking ───────────────────────────────
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS pss_service_code  VARCHAR(100),  -- PSS internal service ID
  ADD COLUMN IF NOT EXISTS last_synced_from_pss TIMESTAMPTZ; -- When EMS last got this from PSS

COMMENT ON COLUMN services.pss_service_code
  IS 'PSS internal service identifier — used to correlate EMS services with PSS catalog';
COMMENT ON COLUMN services.last_synced_from_pss
  IS 'Timestamp when this service was last synchronized from the PSS service catalog';

-- ─── Extend pss_computation_queue: link to ARMS dispatch ─────────────────────
ALTER TABLE pss_computation_queue
  ADD COLUMN IF NOT EXISTS arms_dispatched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pss_response_json  JSONB;

COMMENT ON COLUMN pss_computation_queue.arms_dispatched_at
  IS 'Timestamp when SLA result was forwarded to ARMS audit relay';
COMMENT ON COLUMN pss_computation_queue.pss_response_json
  IS 'Raw response payload from PSS /api/sla/compute';

-- ─── fn_pss_sync_services ─────────────────────────────────────────────────────
-- Called by service-transaction-service after receiving PSS service list.
CREATE OR REPLACE FUNCTION fn_pss_sync_services(
    p_office_id     UUID,
    p_services_json JSONB  -- array of {name, category, client_type, sla_target_seconds, sla_display, is_na, pss_service_code}
) RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
    v_service JSONB;
    v_count   INTEGER := 0;
BEGIN
    FOR v_service IN SELECT * FROM jsonb_array_elements(p_services_json)
    LOOP
        INSERT INTO services (
            name, category, client_type, office_id,
            sla_target_seconds, sla_display, is_na,
            pss_service_code, last_synced_from_pss
        ) VALUES (
            v_service->>'name',
            v_service->>'category',
            v_service->>'client_type',
            p_office_id,
            (v_service->>'sla_target_seconds')::INTEGER,
            v_service->>'sla_display',
            COALESCE((v_service->>'is_na')::BOOLEAN, FALSE),
            v_service->>'pss_service_code',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name                  = EXCLUDED.name,
            sla_target_seconds    = EXCLUDED.sla_target_seconds,
            sla_display           = EXCLUDED.sla_display,
            is_na                 = EXCLUDED.is_na,
            last_synced_from_pss  = NOW();
        v_count := v_count + 1;
    END LOOP;

    INSERT INTO pss_sync_log (sync_type, office_code, status, records_synced)
    SELECT 'services',
           (SELECT code FROM offices WHERE id = p_office_id),
           'success', v_count;

    RETURN v_count;
END;
$$;
```

---

## 5. Updated Service Ownership Matrix

| Table | Owning Service | Read-Access Services |
|---|---|---|
| `offices` | user-management-service | all |
| `users` | user-management-service | service-transaction, audit-log |
| `services` | service-transaction-service | dashboard, performance |
| `transactions` | service-transaction-service | audit-log, dashboard, performance |
| `transaction_status_history` | audit-log-service | performance, dashboard |
| `pss_computation_queue` | time-tracking-sla-service | dashboard |
| `pss_sync_log` | service-transaction-service | dashboard |
| `pss_intake_schema_cache` | service-transaction-service | — |
| `pss_calendar_cache` | time-tracking-sla-service | service-transaction |
| `arms_audit_dispatch_log` | audit-log-service | dashboard |

---

## 6. Updated API Endpoint Mapping

| `mockApi.ts` Function | Method | API GW Route | Target Service |
|---|---|---|---|
| `loginApi` (mock-only) | — | — | ARMS (external, not EMS) |
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
| *(new)* | GET | `/api/auth/me` | api-gateway |
| *(new)* | POST | `/api/pss/sync` | service-transaction-service |
| *(new)* | GET | `/api/pss/status` | service-transaction-service |
| *(new — PSS callback)* | POST | `/api/sla/result` | time-tracking-sla-service |
| *(new)* | GET | `/api/arms/dispatch-status` | audit-log-service |

---

## 7. Target Monorepo Structure

```
EMS_PROJECT/                        ← /workspace/thread
├── src/                            ← existing React app (UNCHANGED)
│   └── api/
│       ├── mockApi.ts              ← keep (dev only)
│       ├── realApi.ts              ← NEW
│       └── index.ts                ← NEW: toggle
├── apps/
│   ├── api-gateway/                port 3001
│   ├── user-management-service/    port 3002
│   ├── service-transaction-service/ port 3003
│   ├── time-tracking-sla-service/  port 3004
│   ├── performance-monitoring-service/ port 3005
│   ├── audit-log-service/          port 3006
│   └── dashboard-reporting-service/ port 3007
├── packages/
│   ├── dto/
│   └── types/
├── database/
│   ├── 01_schema.sql … 06_sprint3_triggers.sql   ← DO NOT TOUCH
│   └── 07_contract_schema.sql                    ← NEW
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

---

## 8. Phased Implementation Strategy

### Phase 1 — Core HTTP
Services: `api-gateway` + `user-management-service` + `service-transaction-service`

Key contracts in scope:
- ARMS JWT validation (`jwt.strategy.ts`)
- `fn_sync_user()` called on first authenticated request
- All 6 transaction CRUD endpoints live against real DB
- PSS offline banner: if PSS unreachable, serve from `services` table + log to `pss_sync_log`

### Phase 2 — Audit & SLA
Services: `audit-log-service` + `time-tracking-sla-service`

Key contracts in scope:
- `arms-dispatch.service.ts` makes real HTTP call to `POST {ARMS_BASE_URL}/api/audit/ingest`
- Writes to `arms_audit_dispatch_log` (pending → sent or failed)
- Retry logic: 3 attempts with exponential backoff
- `POST /api/sla/result` webhook endpoint for PSS callback
- Manages `pss_computation_queue` + `pss_calendar_cache`

### Phase 3 — Performance & Dashboard
Services: `performance-monitoring-service` + `dashboard-reporting-service`

Key contracts in scope:
- `fn_get_office_stats()` and `fn_get_sla_compliance_by_service()` called from real DB
- `arms_audit_dispatch_log` stats surfaced in dashboard (dispatch success rate)
- `pss_sync_log` status shown in admin UI (PSS connectivity status)

### Phase 4 — Kafka
Replaces direct HTTP audit dispatch with `ems.audit.log_created` Kafka topic.
ARMS consumes Kafka topic instead of receiving HTTP POSTs.

---

## 9. New Files (Phase 1)

### Root Config
- `pnpm-workspace.yaml`
- `package.json` (root — workspaces root)
- `docker-compose.yml`
- `database/07_contract_schema.sql` ← NEW migration

### `packages/types/` — mirrors `src/types/index.ts`
- `src/index.ts`, `package.json`, `tsconfig.json`

### `packages/dto/`
- `src/transaction.dto.ts`, `src/user.dto.ts`, `src/auth.dto.ts`
- `src/dashboard.dto.ts`, `src/audit.dto.ts`, `src/pss.dto.ts` ← NEW (PSS payloads)
- `package.json`, `tsconfig.json`

### `apps/api-gateway/`
- `src/main.ts`, `src/app.module.ts`
- `src/auth/jwt.strategy.ts` — ARMS JWT validation
- `src/auth/jwt.guard.ts`, `src/auth/auth.controller.ts`, `src/auth/auth.module.ts`
- `src/proxy/proxy.module.ts`
- `src/proxy/users.proxy.controller.ts`
- `src/proxy/transactions.proxy.controller.ts`
- `src/proxy/audit.proxy.controller.ts`
- `src/proxy/dashboard.proxy.controller.ts`
- `src/proxy/pss.proxy.controller.ts` ← NEW (PSS sync endpoints)
- `src/proxy/sla.proxy.controller.ts` ← NEW (PSS callback)
- `src/common/rls-headers.interceptor.ts`
- `package.json`, `tsconfig.json`, `.env.example`

### `apps/user-management-service/`
- `src/main.ts`, `src/app.module.ts`
- `src/database/database.module.ts` — PG pool + `setRlsContext()`
- `src/users/users.module.ts`, `users.controller.ts`, `users.service.ts`, `users.repository.ts`
- `src/users/arms-sync.service.ts` ← NEW (calls ARMS /api/users/:id for profile enrichment)
- `src/offices/offices.controller.ts`, `offices.service.ts`
- `package.json`, `tsconfig.json`, `.env.example`

### `apps/service-transaction-service/`
- `src/main.ts`, `src/app.module.ts`
- `src/database/database.module.ts`
- `src/services/services.module.ts`, `services.controller.ts`, `services.service.ts`, `services.repository.ts`
- `src/services/pss-sync.service.ts` ← NEW (fetches + caches PSS service catalog)
- `src/services/pss-status.controller.ts` ← NEW (GET /pss/status, POST /pss/sync)
- `src/transactions/transactions.module.ts`, `transactions.controller.ts`
- `src/transactions/transactions.service.ts`, `transactions.repository.ts`
- `src/transactions/audit-dispatch.service.ts` — HTTP POST to audit-log-service
- `package.json`, `tsconfig.json`, `.env.example`

### Frontend
- `src/api/realApi.ts`
- `src/api/index.ts`
- Update `src/auth/AuthContext.tsx` imports
- Update all 6 pages that import from `@/api/mockApi`

---

## 10. New Files (Phase 2)

### `apps/audit-log-service/`
- `src/main.ts`, `src/app.module.ts`, `src/database/database.module.ts`
- `src/audit/audit.module.ts`, `audit.controller.ts`, `audit.service.ts`, `audit.repository.ts`
- `src/audit/arms-dispatch.service.ts` ← real HTTP POST to ARMS `/api/audit/ingest`
- `src/audit/arms-dispatch.repository.ts` ← writes to `arms_audit_dispatch_log`
- `src/audit/arms-dispatch-retry.cron.ts` ← retries `failed` dispatch rows (NestJS `@Cron`)
- `package.json`, `tsconfig.json`, `.env.example`

### `apps/time-tracking-sla-service/`
- `src/main.ts`, `src/app.module.ts`, `src/database/database.module.ts`
- `src/sla/sla.module.ts`, `sla.controller.ts`, `sla.service.ts`, `sla.repository.ts`
- `src/sla/pss-callback.controller.ts` ← NEW: `POST /sla/result` (PSS webhook)
- `src/pss/pss.client.ts` — HTTP client for PSS `/api/sla/compute`
- `src/calendar/calendar.service.ts` ← NEW: serves `pss_calendar_cache`, fallback to `workingCalendar.ts`
- `package.json`, `tsconfig.json`, `.env.example`

---

## 11. New Files (Phase 3)

### `apps/performance-monitoring-service/`
- Standard: `main.ts`, `app.module.ts`, `database.module.ts`
- `src/performance/performance.module.ts`, `controller.ts`, `service.ts`, `repository.ts`
- `package.json`, `tsconfig.json`, `.env.example`

### `apps/dashboard-reporting-service/`
- Standard: `main.ts`, `app.module.ts`, `database.module.ts`
- `src/dashboard/dashboard.module.ts`, `controller.ts`, `service.ts`, `repository.ts`
- `src/dashboard/pss-status.service.ts` ← surfaces PSS connectivity & sync status
- `src/dashboard/arms-dispatch.service.ts` ← surfaces ARMS dispatch health
- `package.json`, `tsconfig.json`, `.env.example`

---

## 12. New Files (Phase 4 — Kafka)

### `packages/kafka/`
- `src/events.ts`, `src/kafka.module.ts`, `src/kafka.service.ts`
- `package.json`, `tsconfig.json`

### Service updates:
- service-transaction-service → emit Kafka instead of HTTP to audit-log-service
- audit-log-service → `@EventPattern()` consumers, also emit `ems.audit.log_created`
- time-tracking-sla-service → `@EventPattern('transaction.completed')`
- docker-compose → add `zookeeper` + `kafka`

---

## 13. Environment Variables Required

### api-gateway `.env`
```
PORT=3001
ARMS_JWT_SECRET=<shared_secret_with_ARMS>
ARMS_PUBLIC_KEY_URL=https://arms.pup.edu.ph/auth/public-key
USER_SVC_URL=http://user-management-service:3002
TRANSACTION_SVC_URL=http://service-transaction-service:3003
AUDIT_SVC_URL=http://audit-log-service:3006
DASHBOARD_SVC_URL=http://dashboard-reporting-service:3007
TIME_TRACKING_SVC_URL=http://time-tracking-sla-service:3004
```

### service-transaction-service `.env`
```
PORT=3003
DATABASE_URL=postgresql://ems_user:ems_pass@postgres:5432/ems_db
PSS_BASE_URL=http://pss.pup.edu.ph/api
PSS_API_KEY=<pss_api_key>
AUDIT_SVC_URL=http://audit-log-service:3006
```

### audit-log-service `.env`
```
PORT=3006
DATABASE_URL=postgresql://ems_user:ems_pass@postgres:5432/ems_db
ARMS_BASE_URL=http://arms.pup.edu.ph/api
ARMS_SERVICE_TOKEN=<ems_service_token_for_arms>
ARMS_DISPATCH_MAX_RETRIES=3
```

### time-tracking-sla-service `.env`
```
PORT=3004
DATABASE_URL=postgresql://ems_user:ems_pass@postgres:5432/ems_db
PSS_BASE_URL=http://pss.pup.edu.ph/api
PSS_SLA_CALLBACK_SECRET=<shared_secret_for_pss_webhook>
```

---

## 14. Key Existing Code Reused

| Existing File | Reused In |
|---|---|
| `database/01–06_*.sql` | Reference only — no recreation |
| `fn_classify_sla()` | time-tracking-sla-service (Phase 1–3, replaced by PSS in Phase 4) |
| `fn_get_office_stats()` | dashboard-reporting-service |
| `fn_get_sla_compliance_by_service()` | performance-monitoring-service |
| `fn_sync_user()` | user-management-service → called on every authenticated request |
| `fn_pss_sync_services()` | service-transaction-service PSS sync ← NEW (from 07_contract_schema.sql) |
| `src/api/client.ts` | `realApi.ts` uses same axios instance |
| `src/types/index.ts` | Copied to `packages/types/src/index.ts` |
| `src/utils/workingCalendar.ts` | Seeded into `pss_calendar_cache` as fallback |
| `src/utils/slaUtils.ts` | Mirrored in time-tracking-sla-service |

---

## 15. NestJS Packages (all services)
```json
{
  "@nestjs/common": "^10",
  "@nestjs/core": "^10",
  "@nestjs/platform-express": "^10",
  "@nestjs/axios": "^3",
  "@nestjs/jwt": "^10",
  "@nestjs/passport": "^10",
  "@nestjs/throttler": "^5",
  "@nestjs/schedule": "^4",
  "passport": "^0.6",
  "passport-jwt": "^4",
  "pg": "^8",
  "reflect-metadata": "^0.1",
  "rxjs": "^7",
  "class-validator": "^0.14",
  "class-transformer": "^0.5"
}
```
Phase 4 only: `kafkajs: ^2`, `@nestjs/microservices: ^10`

---

## 16. Capstone Adviser Scorecard

| Area | Verdict |
|---|---|
| Service Boundaries | ✅ Excellent |
| Docker Compose | ✅ Excellent |
| Shared PostgreSQL + RLS | ✅ Excellent |
| API Gateway (JWT-only, no auth ownership) | ✅ Correct |
| PSS integration (cache + offline fallback) | ✅ Added |
| ARMS audit dispatch (retry log) | ✅ Added |
| PSS callback webhook (`POST /sla/result`) | ✅ Added |
| HTTP REST service-to-service | ✅ Correct |
| Kafka deferred to Phase 4 | ✅ Risk-controlled |
| New migration `07_contract_schema.sql` | ✅ Non-destructive |

---

## 17. Verification Checklist

### Phase 1
- [ ] `docker-compose up` starts postgres + api-gateway + user-svc + transaction-svc
- [ ] `GET /api/auth/me` with valid JWT returns `User` (from JWT claims, no DB call)
- [ ] `GET /api/transactions` returns office-scoped list from real DB
- [ ] `POST /api/transactions` creates row, `fn_sync_user()` upserts user on first login
- [ ] `PATCH /api/transactions/:id/status` → `completed` sets `is_locked = true` in DB
- [ ] PSS offline → `services` table fallback, `pss_sync_log` row written with `status = 'failed'`
- [ ] React with `window.__EMS_USE_REAL_API__ = true` loads all pages correctly

### Phase 2
- [ ] `GET /api/transactions/:id/history` returns rows from `transaction_status_history`
- [ ] `GET /api/audit-log` returns filtered, paginated history
- [ ] Each transaction mutation writes row to `arms_audit_dispatch_log` with `status = 'pending'`
- [ ] `arms-dispatch.service.ts` sends HTTP POST to ARMS, updates row to `status = 'sent'`
- [ ] On ARMS failure: row stays `failed`, retry cron picks it up within 60s
- [ ] `POST /api/sla/result` from PSS updates `pss_computation_queue` + transaction SLA status

### Phase 3
- [ ] `GET /api/dashboard/stats` returns `DashboardStats` from `fn_get_office_stats()`
- [ ] Dashboard shows PSS sync status and ARMS dispatch health

### Phase 4
- [ ] `transaction.created` Kafka event consumed by audit-log-service
- [ ] `arms_audit_dispatch_log` populated from Kafka consumer (not HTTP)
