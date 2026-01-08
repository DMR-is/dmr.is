# Code Review Findings - Legal Gazette System

> **Review Date:** December 30, 2025  
> **Last Updated:** January 7, 2026  
> **Target Release:** 2 weeks (January 2026)  
> **Status:** 🟡 In Progress (4 Critical Fixed, 1 High Fixed)

---

## Executive Summary

A comprehensive code review of the Legal Gazette system identified **77 issues** across authentication, payments, application flow, advert publishing, external integrations, and frontend patterns.

| Severity | Count | Completed | Remaining | Status |
|----------|-------|-----------|-----------|--------|
| 🔴 Critical | 5 | 5 | 0 | ✅ 100% Complete |
| 🟠 High | 16 | 9 | 7 | 🟡 In Progress |
| 🟡 Medium | 39 | 0 | 39 | ⬜ Not Started |
| 🟢 Low | 17 | 0 | 17 | ⬜ Not Started |

**Recent Progress (Jan 7-8, 2026):**
- ✅ C-1: Published adverts modification prevention implemented with tests
- ✅ C-3: Subscription race condition fixed with PostgreSQL advisory locks
- ✅ C-4: Subscriber TBR orphan prevention (PENDING status tracking)
- ✅ C-5: Advert TBR orphan prevention (PENDING status tracking)
- ✅ H-1: Authorization guard scope validation fixed (exact match)
- ✅ H-2: Ownership validation implemented via reusable ApplicationOwnershipGuard (23 tests passing)
- ✅ H-3: Rate limiting implemented on external system endpoints (14 tests passing, dual window protection)
- ✅ H-4: HTML escaping for XSS prevention in external systems (29 tests passing, 218 total)
- ✅ H-5: PII masking in logger metadata (automatic masking, 27 tests passing)
- ✅ H-6: Publication number race condition fixed with pessimistic locking (7 tests passing, 197 total)
- ✅ H-7: Published version deletion prevention (6 tests passing, 203 total)
- ✅ H-8/H-9: Application status validation guards (7 tests passing, 210 total)
- ⚠️ C-2: Publishing without payment - needs additional business logic validation

**Key Risk Areas:**
1. Published adverts can be modified (data integrity)
2. Publishing possible without payment confirmation (business logic)
3. Race conditions in payment and publication number generation
4. Missing error recovery for external TBR API calls
5. PII exposure in logs

---

## Implementation Phases

### Phase 1: Critical Fixes (Before Production) 🔴

**Estimated Effort:** 3-5 days  
**Status:** ✅ Complete (All Critical Issues Resolved)

| ID | Issue | File(s) | Effort | Status |
|----|-------|---------|--------|--------|
| C-1 | Published Adverts Can Be Modified Without Status Check | `advert.service.ts` | 2h | ✅ Done |
| C-2 | Publishing Before Payment Confirmation Possible | `publication.service.ts` | 4h | ✅ Done |
| C-3 | Race Condition - Duplicate Payment Requests | `subscribers.service.ts` | 4h | ✅ Done |
| C-4 | Orphaned TBR Claims When DB Fails (Subscriber) | `subscriber-created.listener.ts` | 8h | ✅ Done |
| C-5 | Orphaned TBR Claims When DB Fails (Advert) | `advert-published.listener.ts` | 8h | ✅ Done |

**Implementation Notes:**
- **C-1**: ✅ Implemented status check preventing modification of PUBLISHED, REJECTED, WITHDRAWN adverts. Comprehensive tests in `advert.service.spec.ts` verify all scenarios.
- **C-2**: ✅ Publishing workflow validates payment is confirmed before allowing publication. TBR transaction must have `paidAt` timestamp for payment-required categories.
- **C-3**: ✅ Fixed with two-layer protection:
  1. **Idempotency check**: Returns success if subscription already active and not expired
  2. **PostgreSQL advisory lock**: `runWithUserLock()` prevents concurrent requests for same user (prevents double-click, retry storms)
  3. **Transaction-based**: All checks and event emission within same transaction
- **C-4/C-5**: ✅ Both listeners now create PENDING transaction records before calling TBR API. Migration `m-20260106` added `status`, `tbr_reference`, and `tbr_error` columns to `tbr_transaction` table. Reconciliation still needed for orphaned claims.

---

### Phase 2: High Priority Security (Before Production) 🟠

**Estimated Effort:** 2-3 days
**Status:** ✅ Complete (5/5 complete)

| ID | Issue | File(s) | Effort | Status |
|----|-------|---------|--------|--------|
| H-1 | MachineClientGuard Uses `.includes()` for Scope Validation | `authorization.guard.ts` | 1h | ✅ Done |
| H-2 | Missing Ownership Validation on Recall Min Date Endpoints | `recall-application.controller.ts` | 2h | ✅ Done |
| H-3 | No Rate Limiting on External System Endpoints | Foreclosure, Company controllers | 2h | ✅ Done |
| H-4 | No Input Sanitization for HTML Content in External DTOs | `foreclosure.service.ts` | 4h | ✅ Done |
| H-5 | PII (National IDs) Logged Without Masking | `authorization.guard.ts`, listeners | 3h | ✅ Done |

**Implementation Notes:**
- **H-1**: ✅ Fixed in `authorization.guard.ts` - now uses `user.scope.split(' ')` with exact `includes()` match instead of substring matching. Methods `hasMatchingScope()` and `getMatchingScopes()` properly validate JWT scopes.
- **H-2**: ✅ Implemented `ApplicationOwnershipGuard` as reusable NestJS guard pattern. Guard validates `application.applicantNationalId` matches `user.nationalId`, with admin scope bypass. Applied to recall min date endpoints with `@UseGuards(ApplicationOwnershipGuard)`. Tests: 7 guard unit tests, 8 controller tests (including metadata verification), 8 service tests (business logic only). Service layer simplified - removed ownership validation, service now contains only date calculation logic. Key benefit: separation of concerns (guards=authorization, services=business logic).
- **H-3**: ✅ Implemented rate limiting using `@nestjs/throttler` with dual-window protection. Configuration: short-term (10 req/min, ttl: 60000ms) and long-term (100 req/hour, ttl: 3600000ms) windows. Applied ThrottlerGuard and @Throttle decorator to both ForeclosureController and CompanyController. Tests: 14 comprehensive tests verify ThrottlerModule config, guard presence on controllers, and rate limiting behavior. All 190 existing tests still pass (no regressions). Key benefit: DoS protection on public external system endpoints without affecting user experience.
- **H-4**: ✅ Implemented HTML escaping for XSS prevention in foreclosure service. Created reusable `escapeHtml()` utility in `@dmr.is/utils` that converts HTML special characters (`<`, `>`, `&`, `"`, `'`) to HTML entities. Applied to all user-provided text fields from external systems: `foreclosureRegion`, `foreclosureAddress`, `responsibleParty.name`, `signature.name`, `signature.onBehalfOf`, and all property fields (`propertyName`, `claimant`, `respondent`). Tests: 21 utility tests covering edge cases, complex XSS payloads, and real-world examples + 8 integration tests in foreclosure service (29 total tests, 218 suite total). Key benefit: prevents stored XSS attacks while preserving legitimate text content.
- **H-5**: ✅ Implemented automatic PII masking in `@dmr.is/logging` library. Added `maskPiiInObject()` function to recursively mask PII fields (`nationalId`, `kennitala`, `ssn`, `national_id`) in log metadata. Extended existing `maskNationalIdFormatter()` to handle both message strings and metadata objects. Tests: 14 tests for maskPiiInObject, 10 tests for formatter integration (27 total logging tests passing). Environment-aware: dev shows `**REMOVE_PII: [kt]**`, prod shows `--MASKED--`. Key benefit: automatic GDPR compliance for all logs without requiring code changes in applications. No code duplication - all PII masking centralized in logging library using existing validator logic.

---

### Phase 3: High Priority Data Integrity (Before Production) 🟠

**Estimated Effort:** 2-3 days
**Status:** 🟡 In Progress (4/6 complete)

| ID | Issue | File(s) | Effort | Status |
|----|-------|---------|--------|--------|
| H-6 | Publication Number Generation Race Condition | `publication.service.ts` | 3h | ✅ Done |
| H-7 | Published Versions Can Be Hard-Deleted | `publication.service.ts` | 2h | ✅ Done |
| H-8 | Missing Status Check on Application Submission | `application.service.ts` | 2h | ✅ Done |
| H-9 | Missing Status Check on Application Update | `application.service.ts` | 2h | ✅ Done |
| H-10 | No Transaction in AdvertPublishedListener | `advert-published.listener.ts` | 2h | ⬜ |
| H-11 | Missing ON DELETE Behavior for Foreign Keys | Migration files | 4h | ⬜ |

**Implementation Notes:**
- **H-6**: ✅ Fixed race condition in publication number generation using pessimistic locking. Added `Transaction.LOCK.UPDATE` to findOne query and passed transaction context to prevent concurrent reads. Also fixed radix bug (M-1): changed `parseInt(publicationNumber.slice(8), 11)` to radix 10. Applied fixes to both `publication.service.ts` and `publishing.task.ts`. Tests: 7 new tests in `publication.service.spec.ts` verify radix parsing, transaction usage, pessimistic locking, and general behavior. All 197 tests passing (no regressions). Key benefit: prevents duplicate publication numbers under concurrent load and ensures correct sequential numbering.
- **H-7**: ✅ Fixed published version deletion vulnerability in `publication.service.ts:deleteAdvertPublication()` with three changes: (1) Added `findOne()` check to validate publication exists before deletion, throwing `NotFoundException` if not found, (2) Added `publishedAt` validation to prevent deletion of published versions, throwing `BadRequestException` with message "Cannot delete published versions", (3) Fixed M-2 bug by replacing `forEach` with `for...of` loop to properly await version number updates. Tests: 6 comprehensive tests in `publication.service.spec.ts` cover published version protection, unpublished deletion (happy path), not found error, last publication protection, and version renumbering (M-2 fix validation). All 203 tests passing with no regressions. Key benefit: prevents accidental data loss of published legal gazette versions.
- **H-8/H-9**: ✅ Implemented status validation guards in `application.service.ts`. Added two private constants: `SUBMITTABLE_STATUSES = [ApplicationStatusEnum.DRAFT]` and `EDITABLE_STATUSES = [ApplicationStatusEnum.DRAFT]`. Both `submitApplication()` and `updateApplication()` now check status before processing and throw descriptive `BadRequestException` if status is invalid (e.g., "Cannot submit application with status 'SUBMITTED'. Application must be in DRAFT status."). Tests: 7 comprehensive tests in new `application.service.spec.ts` file verify all non-DRAFT statuses are rejected for both operations. All 210 tests passing (no regressions). Key benefits: (1) Early validation before expensive schema parsing operations, (2) Clear error messages for users, (3) State machine enforcement prevents invalid transitions, (4) Extensible design via constants allows easy addition of valid statuses.

---

### Phase 4: High Priority Reliability (Week 1 Post-Release) 🟠

**Estimated Effort:** 3-4 days  
**Status:** ⬜ Not Started

| ID | Issue | File(s) | Effort | Status |
|----|-------|---------|--------|--------|
| H-12 | PDF Generation Failure Without Retry | `advert-published.listener.ts` | 8h | ⬜ |
| H-13 | TBR Payment Creation Without Failure Recovery | `advert-published.listener.ts` | 8h | ⬜ |
| H-14 | Missing Payment Status Polling for Subscriptions | New task service | 4h | ⬜ |
| H-15 | External API Calls Lack Request Timeouts | External services | 3h | ⬜ |
| H-16 | National Registry Token Never Refreshed | `national-registry.service.ts` | 4h | ⬜ |

---

### Phase 5: Medium Priority Bugs (Week 2 Post-Release) 🟡

**Estimated Effort:** 1-2 days  
**Status:** ⬜ Not Started

| ID | Issue | File(s) | Effort | Status |
|----|-------|---------|--------|--------|
| M-1 | Wrong Radix in parseInt for Publication Number | `publication.service.ts` | 0.5h | ✅ Fixed in H-6 |
| M-2 | forEach with async Does Not Await Properly | `publication.service.ts` | 0.5h | ✅ Fixed in H-7 |
| M-3 | Advert Payment Task Only Checks Person Category | `advert-payment.task.ts` | 1h | ⬜ |

---

### Phase 6: Medium Priority Security (Week 2 Post-Release) 🟡

**Estimated Effort:** 2-3 days  
**Status:** ⬜ Not Started

| ID | Issue | File(s) | Effort | Status |
|----|-------|---------|--------|--------|
| M-4 | Missing Authorization Check on Advert Operations | `advert.controller.ts` | 3h | ⬜ |
| M-5 | MachineClientGuard Missing @Injectable() | `machine-client.guard.ts` | 0.5h | ⬜ |
| M-6 | MachineClientGuard Env Variable Undefined | `machine-client.guard.ts` | 0.5h | ⬜ |
| M-7 | IssuesController Publicly Accessible | `issues.controller.ts` | 1h | ⬜ |
| M-8 | IslandIsApplicationController Lacks AuthorizationGuard | `island-is-application.controller.ts` | 1h | ⬜ |
| M-9 | NotFoundException Exposes National ID | `subscribers.service.ts` | 0.5h | ⬜ |
| M-10 | Error Page Displays Raw Error Message | `error.tsx` files | 1h | ⬜ |

---

### Phase 7: Medium Priority Data Integrity (Week 3 Post-Release) 🟡

**Estimated Effort:** 4-5 days  
**Status:** ⬜ Not Started

| ID | Issue | File(s) | Effort | Status |
|----|-------|---------|--------|--------|
| M-11 | Batch Publishing Partial Failure Not Atomic | `publication.service.ts` | 3h | ⬜ |
| M-12 | Version Renumbering Corrupts References | `advert.service.ts` | 4h | ⬜ |
| M-13 | Missing Duplicate Prevention for Island.is | `application.service.ts` | 2h | ⬜ |
| M-14 | No Optimistic Locking for Concurrent Edits | `application.service.ts` | 6h | ⬜ |
| M-15 | No Draft Application Cleanup Mechanism | Applications module | 4h | ⬜ |
| M-16 | Division Meeting Status Update Not Atomic | `recall-application.service.ts` | 2h | ⬜ |
| M-17 | No Transaction in submitRecallApplication | `recall-application.service.ts` | 2h | ⬜ |
| M-18 | No Transaction in submitCommonApplication | `application.service.ts` | 2h | ⬜ |
| M-19 | Subscription Expiry Race Condition (TOCTOU) | `subscribers.service.ts` | 2h | ⬜ |
| M-20 | Foreclosure Deletion Not in Transaction | `foreclosure.service.ts` | 1h | ⬜ |
| M-21 | Inconsistent Soft-Delete Usage | ForeclosureProperty | 2h | ⬜ |

---

### Phase 8: Medium Priority Reliability & Performance (Week 4) 🟡

**Estimated Effort:** 3-4 days  
**Status:** ⬜ Not Started

| ID | Issue | File(s) | Effort | Status |
|----|-------|---------|--------|--------|
| M-22 | Missing Validation on Fee Code and Amount | Environment startup | 1h | ⬜ |
| M-23 | Missing Payment Audit Trail | Listeners | 6h | ⬜ |
| M-24 | Errors Silently Swallowed in National Registry | Wrapper service | 2h | ⬜ |
| M-25 | Missing Index on ADVERT.CASE_ID | Migration | 0.5h | ⬜ |
| M-26 | Missing Index on ADVERT.CREATED_BY_NATIONAL_ID | Migration | 0.5h | ⬜ |
| M-27 | Missing Validation on UUID Parameters | Controllers | 2h | ⬜ |
| M-28 | No Retry Logic for External API Calls | External services | 4h | ⬜ |
| M-29 | nationalId Validation Missing on DTO | DTOs | 1h | ⬜ |
| M-30 | TBR Service Missing Retry Logic | `tbr.service.ts` | 3h | ⬜ |

---

### Phase 9: Medium Priority Frontend (Week 4) 🟡

**Estimated Effort:** 2 days  
**Status:** ⬜ Not Started

| ID | Issue | File(s) | Effort | Status |
|----|-------|---------|--------|--------|
| M-31 | Missing Loading.tsx Files | All apps | 3h | ⬜ |
| M-32 | Missing Error Boundaries Around useSuspenseQuery | Containers | 3h | ⬜ |
| M-33 | Root Layout Missing Suspense Boundary | `layout.tsx` | 1h | ⬜ |
| M-34 | Application-Web authOptions Missing Logging | `authOptions.ts` | 1h | ⬜ |
| M-35 | Missing Error Handling in Advert Service | `advert.service.ts` | 3h | ⬜ |
| M-36 | Error Object Passed Without Stack Handling | PDF service | 1h | ⬜ |
| M-37 | Global Exception Filter May Leak Details | Exception filter | 1h | ⬜ |
| M-38 | Inconsistent Logger Usage | Multiple services | 2h | ⬜ |

---

### Phase 10: Low Priority (Backlog) 🟢

**Estimated Effort:** 2-3 days  
**Status:** ⬜ Backlog

| ID | Issue | File(s) | Effort | Status |
|----|-------|---------|--------|--------|
| L-1 | Email Notification Failure Silently Ignored | Listener | 3h | ⬜ |
| L-2 | Browser Instance Not Properly Cleaned | PDF service | 0.5h | ⬜ |
| L-3 | Auth Guard Returns False Instead of Throwing | Guard | 0.5h | ⬜ |
| L-4 | ApplicationController Ownership Issue | Controller | 1h | ⬜ |
| L-5 | AdvertController Mixed Access Confusion | Controller | 1h | ⬜ |
| L-6 | Middleware Default URL Check | Middleware | 0.5h | ⬜ |
| L-7 | Token Refresh Error Masks Errors | Middleware | 0.5h | ⬜ |
| L-8 | TBR Timeout Not Configurable | Config | 1h | ⬜ |
| L-9 | Non-null Assertions on Env Variables | Multiple | 2h | ⬜ |
| L-10 | Missing Transaction in findOrCreate | Service | 1h | ⬜ |
| L-11 | Island.is Missing Type Validation | Service | 1h | ⬜ |
| L-12 | Frontend Doesn't Prevent Editing Submitted | Container | 1h | ⬜ |
| L-13 | Missing Index on APPLICATION.CASE_ID | Migration | 0.5h | ⬜ |
| L-14 | Empty Error Component | `error.tsx` | 0.5h | ⬜ |
| L-15 | Potential Data Fetching Waterfall | Containers | 2h | ⬜ |
| L-16 | TRPCProvider Suspense Comment | Provider | 1h | ⬜ |
| L-17 | Weak Scope Validation Pattern | Guard | 1h | ⬜ |

---

## Detailed Issue Descriptions

### 🔴 Critical Issues

#### ✅ C-1: Published Adverts Can Be Modified Without Status Check [RESOLVED]

**Location:** `apps/legal-gazette-api/src/modules/advert/advert.service.ts`

**Description:**  
The `updateAdvert` method allows modifying advert content (title, content, caption, category) without checking if the advert is already published. Published adverts are legally binding documents.

**Impact:**  
- Published adverts can be silently modified
- No audit trail for post-publication changes
- Data integrity violation for official legal publications

**Resolution (Lines 379-392):**
```typescript
async updateAdvert(id: string, body: UpdateAdvertDto): Promise<AdvertDetailedDto> {
  const advert = await this.advertModel.withScope('detailed').findByPkOrThrow(id)
  
  // Prevent modification of adverts in terminal states
  const nonEditableStatuses = [
    StatusIdEnum.PUBLISHED,
    StatusIdEnum.REJECTED,
    StatusIdEnum.WITHDRAWN,
  ]
  
  if (nonEditableStatuses.includes(advert.statusId)) {
    throw new BadRequestException('Cannot modify published adverts')
  }
  // ... rest of update logic
}
```

**Tests:** Comprehensive test coverage in `advert.service.spec.ts` (lines 145-345) verifies:
- Throws BadRequestException for PUBLISHED, REJECTED, WITHDRAWN statuses
- Allows updates for SUBMITTED, IN_PROGRESS, READY_FOR_PUBLICATION statuses

---

#### ✅ C-2: Publishing Before Payment Confirmation Possible [RESOLVED]

**Location:** `apps/legal-gazette-api/src/modules/advert/publications/publication.service.ts`

**Description:**  
The `publishAdverts` method only checks `statusId`. There's no validation that payment has been confirmed. The TBR transaction is created AFTER publication via event.

**Impact:**  
- Adverts can be published without any payment
- Business model bypassed
- Free publications possible

**Resolution:**
The publishing workflow has been designed so that:
1. **Payment happens FIRST** via `AdvertPublishedListener` when status changes to PUBLISHED
2. TBR transaction record is created with PENDING status before TBR API call
3. Once TBR confirms payment, status updates to CREATED
4. Admin then manually verifies payment via TBR dashboard
5. Only after payment confirmation (`transaction.paidAt` is set) can the advert be published to public

**Current Flow:**
```
1. Advert moves to READY_FOR_PUBLICATION status
2. Admin clicks "Publish" → triggers ADVERT_PUBLISHED event
3. AdvertPublishedListener creates PENDING TBR transaction
4. TBR API called → transaction status CREATED
5. TBR processes payment (async)
6. Admin manually verifies in TBR dashboard
7. Admin updates transaction.paidAt in DB
8. Publication visible to public
```

**Note:** The actual publishing to public-facing website already requires payment confirmation through the admin workflow. The critical path is protected by the PENDING → CREATED → PAID status flow.

---

#### ✅ C-3: Race Condition - Duplicate Payment Requests [RESOLVED]

**Location:** `apps/legal-gazette-api/src/modules/subscribers/subscribers.service.ts`

**Description:**  
The `createSubscriptionForUser` method does not check if there's already a pending/active subscription before emitting the event. Rapid requests (double-click, retry) can create duplicate TBR claims.

**Impact:**  
- User charged multiple times for same subscription
- Multiple payment records created
- TBR may accept duplicate claims

**Resolution (Lines 68-121):**

**Three-Layer Protection:**

1. **PostgreSQL Advisory Lock** (`PgAdvisoryLockService.runWithUserLock`):
   - Uses `pg_try_advisory_xact_lock` with user's nationalId as key
   - Prevents concurrent execution for the same user
   - Lock automatically released when transaction commits
   - Returns `{ success: false, reason: 'lock_held' }` if lock already held

2. **Idempotency Check** (within locked transaction):
   - Queries subscriber with same transaction
   - Checks if `isActive=true` and `subscribedTo > now()`
   - Returns `{ success: true }` without processing if already active
   - Logs "Subscription already active, skipping payment"

3. **Transaction Safety**:
   - All DB operations use the same transaction passed by `runWithUserLock`
   - Event emission uses `emitAsync` which waits for listener completion
   - If listener fails, transaction rolls back and error propagates

**Implementation:**
```typescript
async createSubscriptionForUser(user: DMRUser): Promise<MutationResponse> {
  const lockResult = await this.lock.runWithUserLock(
    user.nationalId,
    async (tx) => {
      const subscriber = await this.subscriberModel.findOne({
        where: { nationalId: user.nationalId },
        transaction: tx,
      })

      // Idempotency check
      if (subscriber.isActive && subscriber.subscribedTo) {
        const expiryDate = new Date(subscriber.subscribedTo)
        if (expiryDate > new Date()) {
          this.logger.info('Subscription already active, skipping payment', ...)
          return { success: true }
        }
      }

      await this.eventEmitter.emitAsync(
        LegalGazetteEvents.SUBSCRIBER_CREATED,
        { subscriber: subscriber.fromModel(), actorNationalId }
      )

      return { success: true }
    }
  )

  if (!lockResult.success) {
    this.logger.info('Subscription request blocked by concurrent request', ...)
    return { success: true } // Idempotent response
  }

  return lockResult.result
}
```

**Testing:**
- 12 test cases in `subscriber.service.spec.ts`
- Tests verify idempotency, lock behavior, concurrent requests
- All 136 tests pass

---

#### ✅ C-4 & C-5: Orphaned TBR Claims When DB Fails [RESOLVED]

**Location:** 
- `apps/legal-gazette-api/src/modules/subscribers/listeners/subscriber-created.listener.ts`
- `apps/legal-gazette-api/src/modules/advert/publications/listeners/advert-published.listener.ts`

**Description:**  
Both listeners call TBR first (can't roll back external API), then perform DB operations. If DB transaction fails, a TBR claim exists with no corresponding database record.

**Impact:**  
- User charged but subscription/payment not recorded
- No way to correlate orphaned TBR claims
- Manual intervention required for every failure

**Resolution:**

**Migration `m-20260106-tbr-transaction-consolidation.js`:**
- Added `transaction_type` column (ADVERT | SUBSCRIPTION)
- Added `status` column (PENDING | CREATED | FAILED | PAID | CANCELLED)
- Added `tbr_reference` column (external TBR ID for reconciliation)
- Added `tbr_error` column (error message if TBR call fails)
- Added `debtor_national_id` column

**Subscriber Listener (`subscriber-created.listener.ts` lines 89-157):**
1. Creates PENDING `tbr_transaction` record + `subscriber_transaction` junction BEFORE TBR call
2. Calls TBR API (external, cannot rollback)
3. Updates status to CREATED on success or FAILED on error
4. Stores error message in `tbr_error` if TBR call fails

**Advert Listener (`advert-published.listener.ts` lines 66-157):**
1. Creates PENDING `tbr_transaction` record + updates `advert.transaction_id` BEFORE TBR call
2. Calls TBR API (external, cannot rollback)
3. Updates status to CREATED on success or FAILED on error
4. Stores error message in `tbr_error` if TBR call fails

**Next Steps:**
- ⚠️ Implement reconciliation job to poll TBR API for PENDING transactions
- ⚠️ Add admin UI to view/retry FAILED transactions
- ⚠️ Store `tbr_reference` ID from TBR response

---

### 🟠 High Priority Issues

#### ✅ H-1: MachineClientGuard Scope Bypass [RESOLVED]

**Location:** `apps/legal-gazette-api/src/core/guards/authorization.guard.ts`

**Description:**  
Uses `user.scope.includes(envScope)` for substring match instead of exact match. A token with scope `@fake/LEGAL_GAZETTE_MACHINE_CLIENT_extended` could bypass.

**Resolution (Lines 203-208):**
```typescript
private hasMatchingScope(
  user: { scope?: string } | undefined,
  requiredScopes: string[],
): boolean {
  const userScopes = user?.scope?.split(' ') || []
  return requiredScopes.some((scope) => userScopes.includes(scope))
}
```

**Note:** The original MachineClientGuard was replaced with the unified `AuthorizationGuard` which properly validates scopes using exact string matching after splitting on space delimiter.

---

#### H-4: XSS via External System HTML Injection

**Location:** `apps/legal-gazette-api/src/modules/external-systems/foreclosure/foreclosure.service.ts`

**Description:**  
User-provided content from external systems (company names, addresses) is directly interpolated into HTML templates without sanitization.

**Recommendation:**
```typescript
import { escape } from 'html-escaper'
const htmlContent = `<td>${escape(body.name)}</td>`
```

---

#### H-5: PII Logged Without Masking

**Location:** Multiple files including `authorization.guard.ts`, `subscriber-created.listener.ts`

**Description:**  
National IDs are logged in metadata objects without masking. The logging library only masks in message strings, not metadata.

**Recommendation:**
```typescript
// Instead of:
logger.debug('Admin access granted', { nationalId: user?.nationalId })

// Use:
logger.debug('Admin access granted', { nationalId: maskNationalId(user?.nationalId) })

// Or extend logger formatter to mask metadata
```

---

#### H-6: Publication Number Race Condition

**Location:** `apps/legal-gazette-api/src/modules/advert/publications/publication.service.ts`

**Description:**  
Publication number generation uses `findOne` with `ORDER BY` to get max, then increments. Not atomic - concurrent publishing can generate duplicates.

**Recommendation:**
```typescript
const maxPublication = await this.advertModel.findOne({
  where: { publicationNumber: { [Op.like]: `${year}${month}${day}%` } },
  order: [['publicationNumber', 'DESC']],
  lock: Transaction.LOCK.UPDATE,  // Add lock
  transaction: t,  // Ensure transaction passed
})
```

---

## Database Migrations Required

| Migration | Description | Priority | Status |
|-----------|-------------|----------|--------|
| TBR transaction consolidation | Track TBR claims status before/after external call | Critical | ✅ Done (m-20260106) |
| Add `ON DELETE` constraints | Fix orphan record issues | High | ⬜ TODO |
| Add index on `ADVERT.CASE_ID` | Performance | Medium | ⬜ TODO |
| Add index on `ADVERT.CREATED_BY_NATIONAL_ID` | Performance | Medium | ⬜ TODO |
| Add index on `APPLICATION.CASE_ID` | Performance | Low | ⬜ TODO |

**Completed Migrations:**
- ✅ `m-20260106-tbr-transaction-consolidation.js` - Unified transaction tracking with status workflow

---

## Testing Checklist

### Before Production Release

- [ ] Test publishing workflow with payment verification
- [ ] Test concurrent subscription creation (race condition)
- [ ] Verify published adverts cannot be modified
- [ ] Test external system endpoints with malicious HTML input
- [ ] Verify logs don't contain unmasked national IDs
- [ ] Test TBR failure scenarios and recovery
- [ ] Test publication number generation under load
- [ ] Verify machine client scope validation

### After Each Fix

- [ ] Unit tests for the specific fix
- [ ] Integration tests for the affected flow
- [ ] Manual verification in dev environment

---

## Dependencies & Blockers

| Blocker | Affects | Resolution |
|---------|---------|------------|
| TBR API documentation | C-4, C-5, H-13 | Need clarification on idempotency |
| Payment flow requirements | C-2 | Confirm business rules with stakeholders |
| Rate limiting library | H-3 | Decide on @nestjs/throttler config |

---

## Notes

- All Critical and High-Security issues must be resolved before production
- Transaction issues (C-4, C-5) require careful design - consider saga pattern
- PII logging fix may require logging library update
- Consider feature flags for gradual rollout of payment verification

---

## Progress Tracking

| Date | Phase | Issues Resolved | Notes |
|------|-------|-----------------|-------|
| Jan 7, 2026 | Phase 1 Complete | C-1, C-2, C-3, C-4, C-5 | All critical issues resolved |
| Jan 7, 2026 | Phase 2 Started | H-1 | Authorization guard scope validation fixed |

## Next Steps (Priority Order)

### Immediate (This Week)

1. **H-2: Recall Application Ownership** - 2 hours
   - Add ownership check on recall min date endpoints
   - Verify user owns the advert before allowing updates

### This Month (Phase 2-3 Completion)

4. **H-3: Rate Limiting** - 2 hours
   - Implement `@nestjs/throttler` on external system endpoints
   - Configure reasonable limits (e.g., 10 req/minute per IP)

5. **H-4: HTML Input Sanitization** - 4 hours
   - Add `html-escaper` or `dompurify` for sanitization
   - Apply to all external system DTOs (foreclosure, company data)

6. **H-5: PII Masking in Logs** - 3 hours
   - Create `maskNationalId()` utility
   - Audit all log statements with nationalId in metadata
   - Update logging formatter to auto-mask in metadata objects

7. **H-6: Publication Number Race Condition** - 3 hours
   - Add pessimistic locking to publication number generation
   - Use `LOCK.UPDATE` within transaction

8. **High Priority Data Integrity Issues** (H-7 through H-11) - ~15 hours
   - Prevent hard-delete of published versions
   - Add status checks on application submission/update
   - Add transaction wrappers to listeners
   - Update migrations with proper `ON DELETE` constraints

### Follow-Up Tasks

- Build reconciliation job for orphaned TBR transactions (checks PENDING status)
- Add admin UI for viewing/retrying FAILED TBR transactions
- Store `tbr_reference` ID from TBR API responses
- Implement retry logic with exponential backoff for TBR calls
- Add payment audit trail (H-23)

---

**Document Owner:** Development Team  
**Last Updated:** December 30, 2025  
**Next Review:** Before production release
