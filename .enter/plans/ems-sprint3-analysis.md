# Sprint 3 — EMS Analysis & Implementation Plan
## Focus Stories: EMS-004, EMS-015, EMS-024, EMS-025

---

## 1. Sprint 3 Context

**Sprint Goal:** Implement transaction history views with strict office-scoped data isolation,
per-transaction audit timelines showing all lifecycle events, and a complete immutable audit log.

**Sprint Stories:** EMS-004, EMS-013, EMS-014, EMS-015, EMS-024, EMS-025, EMS-026  
**User-specified stories:** EMS-004, EMS-015, EMS-024, EMS-025  

---

## 2. Current State — What Is Already Implemented

| Story | Feature | Status | Location |
|-------|---------|--------|----------|
| EMS-004 | Service selector per office | ✅ Done | `CreateTransactionDialog.tsx` |
| EMS-004 | Dynamic intake fields per service | ✅ Done | `serviceIntakeSchema.ts` |
| EMS-004 | Auto time-in on submission | ✅ Done | `mockApi.ts:createTransactionApi()` |
| EMS-004 | Initial status = Pending | ✅ Done | `mockApi.ts` |
| EMS-004 | N/A service flag filtering | ❌ Missing | No `is_na` on Service type |
| EMS-004 | PSS offline fallback banner | ❌ Missing | No banner in UI |
| EMS-015 | `TransactionStatusHistory` type | ✅ Done | `types/index.ts` |
| EMS-015 | `getTransactionHistoryApi()` | ✅ Done | `mockApi.ts` |
| EMS-015 | History logging (create/status/assign/docs) | ✅ Done | `mockApi.ts` |
| EMS-015 | Audit Timeline card on detail page | ✅ Done | `TransactionDetailPage.tsx:L488-515` |
| EMS-015 | `action_type` field on each entry | ❌ Missing | Not in `TransactionStatusHistory` |
| EMS-015 | `old_value`/`new_value` string fields | ❌ Missing | Only status-specific fields exist |
| EMS-015 | All 5 AC fields visible in UI | ⚠️ Partial | old/new for status ✅, others ❌ |
| EMS-024 | Status changes logged | ✅ Done | `mockApi.ts:updateTransactionStatusApi()` |
| EMS-024 | Assignment changes logged | ✅ Done | `mockApi.ts:assignTransactionApi()` |
| EMS-024 | Documentary changes logged | ✅ Done | `mockApi.ts:updateDocumentaryStatusApi()` |
| EMS-024 | Transaction creation logged | ✅ Done | `mockApi.ts:createTransactionApi()` |
| EMS-024 | `action_type` on every log entry | ❌ Missing | `TransactionStatusHistory` lacks field |
| EMS-024 | ARMS fire-and-forget dispatch | ❌ Missing | No async dispatch simulation |
| EMS-024 | Append-only enforcement | ❌ Missing | `_history` array can be mutated |
| EMS-025 | API blocks writes on completed txns | ✅ Done | Both update APIs check `status === 'completed'` |
| EMS-025 | `canModify` UI gate | ✅ Done | `TransactionDetailPage.tsx:L74` |
| EMS-025 | `is_locked` explicit field on Transaction | ❌ Missing | Not in `types/index.ts` |
| EMS-025 | "Completed – Read Only" prominent banner | ❌ Missing | Not rendered in detail page |
| EMS-025 | Lock icon in transaction header | ❌ Missing | `Lock` icon imported but not shown |

---

## 3. Microservice Ownership

| Story | Microservice | Module(s) |
|-------|-------------|-----------|
| EMS-004 | **MS-2 transaction-core** | `transaction`, `pss-reference-cache` |
| EMS-015 | **MS-2** (data owner, read endpoint) | `transaction` |
| EMS-024 | **MS-2** (local append-only log) + **MS-4 audit-relay** (ARMS dispatch) | `transaction` + `audit-dispatcher` |
| EMS-025 | **MS-2 transaction-core** | `transaction` |

MS-4 (audit-relay) is the fire-and-forget dispatcher. It has **no own database** — it listens to
Kafka topics emitted by MS-2 and formats/posts to ARMS. For Sprint 3, ARMS integration is not yet
live (Sprint 4 EMS-027), so MS-4 is simulated with a console log + mock HTTP call.

---

## 4. Database Changes (ems_transactions — MS-2)

### EMS-025: Add immutable lock flag
```sql
-- File: database/05_sprint3_schema.sql
ALTER TABLE transaction
  ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT FALSE;

-- Auto-set lock via trigger on completion
CREATE OR REPLACE FUNCTION fn_lock_on_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    NEW.is_locked := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lock_on_complete
BEFORE UPDATE ON transaction
FOR EACH ROW EXECUTE FUNCTION fn_lock_on_complete();
```

### EMS-024 + EMS-015: Enhance audit log table
```sql
ALTER TABLE transaction_status_log
  ADD COLUMN action_type VARCHAR(50) NOT NULL DEFAULT 'STATUS_CHANGE',
  ADD COLUMN old_value   TEXT,
  ADD COLUMN new_value   TEXT;

-- Append-only: block DELETE and UPDATE on audit rows
CREATE RULE no_delete_audit AS ON DELETE TO transaction_status_log DO INSTEAD NOTHING;
CREATE RULE no_update_audit AS ON UPDATE TO transaction_status_log DO INSTEAD NOTHING;
```

### EMS-004: Add N/A flag to services (owned by PSS, cached in MS-2)
```sql
-- pss_cache already holds JSON payload; for the local services table (if using one):
ALTER TABLE services ADD COLUMN is_na BOOLEAN NOT NULL DEFAULT FALSE;
```

---

## 5. API Changes

| Method | Endpoint | Story | Notes |
|--------|----------|-------|-------|
| `POST` | `/transactions` | EMS-004 | Filter `is_na=true` services from selector |
| `GET` | `/transactions/{id}/audit-log` | EMS-015 | Returns enriched audit entries |
| `PUT` | `/transactions/{id}/status` | EMS-025 | Guard: 403 if `is_locked=true` |
| `PUT` | `/transactions/{id}/documentary-status` | EMS-025 | Guard: 403 if `is_locked=true` |
| `PUT` | `/transactions/{id}/assignment` | EMS-025 | Guard: 403 if `is_locked=true` |

---

## 6. Kafka Events (MS-2 → MS-4 → ARMS)

| Topic | Emitted By | Consumed By | Story |
|-------|-----------|-------------|-------|
| `ems.transaction.created` | MS-2 | MS-4 | EMS-024 |
| `ems.transaction.status_changed` | MS-2 | MS-4 | EMS-024 |
| `ems.transaction.assigned` | MS-2 | MS-4 | EMS-024 |
| `ems.transaction.documentary_changed` | MS-2 | MS-4 | EMS-024 |
| `ems.audit.events` | MS-4 | ARMS ingestion API | EMS-024 |

For Sprint 3 (ARMS not yet live), MS-4 dispatch is simulated with `console.log(auditPayload)`.

---

## 7. Gaps, Conflicts & Architectural Concerns

### Gap 1 — EMS-004 PSS dependency
EMS-004 AC2 requires "intake schema from PSS Reference API" but PSS integration (EMS-028C)
is Sprint 4. **Resolution**: Frontend local schema (`serviceIntakeSchema.ts`) serves as the
Sprint 3 implementation. Sprint 4 swaps it for a real PSS API call. Current code is correct.

### Gap 2 — EMS-024 ARMS dependency
EMS-024 AC2 requires async dispatch to ARMS, but ARMS JWT integration (EMS-027) is Sprint 4.
**Resolution**: Simulate with a `dispatchToARMS(event)` function that logs payload to console
and returns immediately. Interface is defined now; body is swapped in Sprint 4.

### Gap 3 — `action_type` not in existing history entries
Current `TransactionStatusHistory` has no `action_type` field. This creates a schema conflict
between EMS-015 and EMS-024 (both need it). **Resolution**: Add `action_type` to the interface
NOW; backfill mock data with correct types.

### Gap 4 — EMS-025 vs. mock enforceability
Mock `_history` is a regular array — no real append-only guarantee. In production, the PostgreSQL
rule blocks UPDATE/DELETE. **Resolution**: Export `_history` as a frozen proxy in mock.

### Overlap — EMS-013/EMS-014
Both are already substantially implemented (office scope filter in `getTransactionsApi()`).
Only missing: office name in the transactions list header (EMS-014 AC2).

---

## 8. Development Order

1. **EMS-025** — Add `is_locked` field + "Completed – Read Only" banner (fastest, no dependencies)
2. **EMS-024** — Enhance `TransactionStatusHistory` (add `action_type`, `old_value`, `new_value`)
   → Update all `_history.push()` calls → Simulate ARMS dispatch
3. **EMS-015** — Update audit timeline UI to show all 5 required AC fields
4. **EMS-004** — Add `is_na` to `Service`, filter from dialog, add PSS offline banner
5. **EMS-013/EMS-014 cleanup** — Add office name to transaction list header
6. **EMS-026** — New Audit Log viewer page (cross-cutting, low risk to add)
7. **Database SQL** — `05_sprint3_schema.sql` with all ALTER statements + new triggers/rules

---

## 9. Files to Modify / Create

### Modified
| File | Changes |
|------|---------|
| `src/types/index.ts` | Add `is_locked`, `action_type`, `old_value`, `new_value` to Transaction / History types; add `is_na` to Service |
| `src/api/mockApi.ts` | Set `is_locked=true` on completion; populate `action_type`+`old_value`+`new_value` in all `_history.push()` calls; add `dispatchToARMS()` stub; add `getAuditLogApi()` |
| `src/utils/mockData.ts` | Add `is_na: false` to all services; add `is_locked: false` to all transactions |
| `src/pages/TransactionDetailPage.tsx` | Show "Completed – Read Only" banner + Lock icon; render all 5 AC fields in audit timeline |
| `src/pages/TransactionsPage.tsx` | Add office name header (EMS-014 AC2) |
| `src/components/transactions/CreateTransactionDialog.tsx` | Filter `is_na` services (EMS-004 AC1) |
| `src/App.tsx` | Add `/audit-log` route |

### Created
| File | Purpose |
|------|---------|
| `src/pages/AuditLogPage.tsx` | EMS-026 — audit log viewer with filters (date, action type, actor, txn ID) |
| `database/05_sprint3_schema.sql` | `is_locked` column, `action_type`/`old_value`/`new_value` on log, `is_na` on services |
| `database/06_sprint3_triggers.sql` | `trg_lock_on_complete`, append-only rules, enhanced audit triggers |

---

## 10. Acceptance Criteria Verification Checklist

### EMS-004
- [ ] N/A-flagged services excluded from service selector
- [ ] PSS offline banner displayed when using cached schema
- [ ] Auto time-in on creation, no manual entry UI
- [ ] New transaction appears with Pending status

### EMS-015
- [ ] Audit timeline shows entries in chronological order
- [ ] Each entry shows: action type, actor name, timestamp, old value, new value
- [ ] Timeline is read-only for all roles

### EMS-024
- [ ] All 5 write operations generate audit records with all required fields
- [ ] ARMS dispatch function fires asynchronously, does not block operation
- [ ] No delete/edit controls on audit log entries

### EMS-025
- [ ] `is_locked = true` set atomically at completion
- [ ] 403 returned from any write API on locked transaction
- [ ] "Completed – Read Only" label visible on detail page
- [ ] No edit controls visible on completed transactions
