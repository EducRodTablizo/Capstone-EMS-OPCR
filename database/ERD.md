# EMS Database — Entity Relationship Description

## Tables

### `offices`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | VARCHAR(150) | |
| code | ENUM | ADMIN_OFFICE, ACADEMIC_OFFICE, OSAS |

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | Same as ARMS user ID (JWT sub) |
| name | VARCHAR(200) | |
| email | VARCHAR(200) UNIQUE | |
| role | ENUM | subsystem_admin, staff, opcr_evaluator |
| office_id | UUID FK → offices | |
| is_active | BOOLEAN | |
| synced_at | TIMESTAMPTZ | Last sync from ARMS |

### `services`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | VARCHAR(500) | From OPCR Citizen Charter |
| category | VARCHAR(100) | Medical, Dental, Enrollment, etc. |
| client_type | VARCHAR(100) | Student, Faculty, General, etc. |
| office_id | UUID FK → offices | |
| sla_target_seconds | INTEGER | Parsed from Citizen Charter |
| sla_display | VARCHAR(100) | Human-readable e.g. "22 min" |
| is_active | BOOLEAN | |

### `transactions` (core entity)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| service_id | UUID FK → services | |
| office_id | UUID FK → offices | For RLS isolation |
| assigned_to | UUID FK → users | Nullable |
| created_by | UUID FK → users | |
| time_in | TIMESTAMPTZ | **Auto** via trigger (EMS-004) |
| time_out | TIMESTAMPTZ | **Auto** on completion (EMS-008) |
| status | ENUM | pending → in_progress → completed |
| documentary_status | ENUM | complete, incomplete, for_compliance |
| processing_time_seconds | INTEGER | Computed (EMS-009) |
| sla_target_seconds | INTEGER | Snapshot from service at creation |
| sla_status | ENUM | compliant, non_compliant, pending_computation |
| is_sla_breached | BOOLEAN | EMS-012 flag |
| client_name | VARCHAR(300) | |
| remarks | TEXT | |

### `transaction_status_history`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| transaction_id | UUID FK → transactions | |
| old_status | ENUM | NULL on creation |
| new_status | ENUM | |
| documentary_old | ENUM | |
| documentary_new | ENUM | |
| changed_by | UUID FK → users | |
| changed_at | TIMESTAMPTZ | |
| remarks | TEXT | |

### `pss_computation_queue`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| transaction_id | UUID FK → transactions | |
| time_in / time_out | TIMESTAMPTZ | Submitted to PSS |
| duration_secs | INTEGER | |
| status | VARCHAR | queued, submitted, received, failed |
| attempts | INTEGER | For retry logic |
| pss_result | VARCHAR | compliant/non_compliant returned by PSS |

## Relationships

```
offices ──< users          (1 office → many users)
offices ──< services       (1 office → many services)
offices ──< transactions   (1 office → many transactions)
services ──< transactions  (1 service → many transactions)
users ──< transactions     (created_by: 1 user → many transactions)
users ──< transactions     (assigned_to: nullable)
transactions ──< transaction_status_history
transactions ──< pss_computation_queue
```

## Sprint 1 → EMS Stories Mapping

| User Story | DB Mechanism |
|---|---|
| EMS-001 | `users` table, read-only |
| EMS-002 | JWT claims → RLS via `ems.current_office_id` |
| EMS-003 | `transactions` RLS policy |
| EMS-004 | `trg_auto_time_in` trigger |
| EMS-005 | `assigned_to` FK, validated in NestJS |
| EMS-006 | `status` column + `transaction_status_history` |
| EMS-007 | `documentary_status` column |
| EMS-008 | `trg_auto_time_out` trigger |
| EMS-009 | `fn_compute_processing_time()` |
| EMS-010 | `sla_target_seconds` snapshot + PSS fetch |
| EMS-011 | `fn_classify_sla()` + `trg_classify_sla` |
| EMS-012 | `is_sla_breached` column |
