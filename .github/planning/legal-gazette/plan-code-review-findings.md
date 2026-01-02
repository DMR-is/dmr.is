# Code Review Findings - Legal Gazette System

> **Review Date:** December 30, 2025  
> **Target Release:** 2 weeks (January 2026)  
> **Status:** 🔴 Action Required Before Production

---

## Executive Summary

A comprehensive code review of the Legal Gazette system identified **77 issues** across authentication, payments, application flow, advert publishing, external integrations, and frontend patterns.

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 5 | Not Started |
| 🟠 High | 16 | Not Started |
| 🟡 Medium | 39 | Not Started |
| 🟢 Low | 17 | Not Started |

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
**Status:** ⬜ Not Started

| ID | Issue | File(s) | Effort | Status |
|----|-------|---------|--------|--------|
| C-1 | Published Adverts Can Be Modified Without Status Check | `advert.service.ts` | 2h | ⬜ |
| C-2 | Publishing Before Payment Confirmation Possible | `publication.service.ts` | 4h | ⬜ |
| C-3 | Race Condition - Duplicate Payment Requests | `subscribers.service.ts` | 4h | ⬜ |
| C-4 | Orphaned TBR Claims When DB Fails (Subscriber) | `subscriber-created.listener.ts` | 8h | ⬜ |
| C-5 | Orphaned TBR Claims When DB Fails (Advert) | `advert-published.listener.ts` | 8h | ⬜ |

---

### Phase 2: High Priority Security (Before Production) 🟠

**Estimated Effort:** 2-3 days  
**Status:** ⬜ Not Started

| ID | Issue | File(s) | Effort | Status |
|----|-------|---------|--------|--------|
| H-1 | MachineClientGuard Uses `.includes()` for Scope Validation | `machine-client.guard.ts` | 1h | ⬜ |
| H-2 | Missing Ownership Validation on Recall Min Date Endpoints | `recall-application.controller.ts` | 2h | ⬜ |
| H-3 | No Rate Limiting on External System Endpoints | Foreclosure, Company controllers | 2h | ⬜ |
| H-4 | No Input Sanitization for HTML Content in External DTOs | `foreclosure.service.ts` | 4h | ⬜ |
| H-5 | PII (National IDs) Logged Without Masking | `authorization.guard.ts`, listeners | 3h | ⬜ |

---

### Phase 3: High Priority Data Integrity (Before Production) 🟠

**Estimated Effort:** 2-3 days  
**Status:** ⬜ Not Started

| ID | Issue | File(s) | Effort | Status |
|----|-------|---------|--------|--------|
| H-6 | Publication Number Generation Race Condition | `publication.service.ts` | 3h | ⬜ |
| H-7 | Published Versions Can Be Hard-Deleted | `advert.service.ts` | 2h | ⬜ |
| H-8 | Missing Status Check on Application Submission | `application.service.ts` | 2h | ⬜ |
| H-9 | Missing Status Check on Application Update | `application.service.ts` | 2h | ⬜ |
| H-10 | No Transaction in AdvertPublishedListener | `advert-published.listener.ts` | 2h | ⬜ |
| H-11 | Missing ON DELETE Behavior for Foreign Keys | Migration files | 4h | ⬜ |

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
| M-1 | Wrong Radix in parseInt for Publication Number | `publication.service.ts` | 0.5h | ⬜ |
| M-2 | forEach with async Does Not Await Properly | `advert.service.ts` | 0.5h | ⬜ |
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

#### C-1: Published Adverts Can Be Modified Without Status Check

**Location:** `apps/legal-gazette-api/src/modules/advert/advert.service.ts`

**Description:**  
The `updateAdvert` method allows modifying advert content (title, content, caption, category) without checking if the advert is already published. Published adverts are legally binding documents.

**Impact:**  
- Published adverts can be silently modified
- No audit trail for post-publication changes
- Data integrity violation for official legal publications

**Recommendation:**
```typescript
async updateAdvert(id: string, body: UpdateAdvertDto): Promise<AdvertDetailedDto> {
  const advert = await this.advertModel.withScope('detailed').findByPkOrThrow(id)
  
  if (advert.statusId === StatusIdEnum.PUBLISHED) {
    throw new BadRequestException('Cannot modify published adverts')
  }
  // ... rest of update logic
}
```

---

#### C-2: Publishing Before Payment Confirmation Possible

**Location:** `apps/legal-gazette-api/src/modules/advert/publications/publication.service.ts`

**Description:**  
The `publishAdverts` method only checks `statusId`. There's no validation that payment has been confirmed. The TBR transaction is created AFTER publication via event.

**Impact:**  
- Adverts can be published without any payment
- Business model bypassed
- Free publications possible

**Recommendation:**
```typescript
async publishAdverts(advertIds: string[]): Promise<void> {
  for (const advert of adverts) {
    if (this.isPaymentRequired(advert) && !advert.transaction?.paidAt) {
      throw new BadRequestException(`Payment required before publishing advert ${advert.id}`)
    }
  }
}
```

---

#### C-3: Race Condition - Duplicate Payment Requests

**Location:** `apps/legal-gazette-api/src/modules/subscribers/subscribers.service.ts`

**Description:**  
The `createSubscriptionForUser` method does not check if there's already a pending/active subscription before emitting the event. Rapid requests (double-click, retry) can create duplicate TBR claims.

**Impact:**  
- User charged multiple times for same subscription
- Multiple payment records created
- TBR may accept duplicate claims

**Recommendation:**
```typescript
async createSubscriptionForUser(user: DMRUser): Promise<MutationResponse> {
  const subscriber = await this.subscriberModel.findOne({
    where: { nationalId: user.nationalId },
  })

  // Check for existing active subscription
  if (subscriber.isActive && subscriber.subscribedTo && 
      new Date(subscriber.subscribedTo) > new Date()) {
    return { success: true } // Idempotent return
  }

  // Add distributed lock to prevent concurrent creation
  // ...
}
```

---

#### C-4 & C-5: Orphaned TBR Claims When DB Fails

**Location:** 
- `apps/legal-gazette-api/src/modules/subscribers/listeners/subscriber-created.listener.ts`
- `apps/legal-gazette-api/src/modules/advert/publications/listeners/advert-published.listener.ts`

**Description:**  
Both listeners call TBR first (can't roll back external API), then perform DB operations. If DB transaction fails, a TBR claim exists with no corresponding database record.

**Impact:**  
- User charged but subscription/payment not recorded
- No way to correlate orphaned TBR claims
- Manual intervention required for every failure

**Recommendation:**
1. Add `pending_tbr_claims` table to track claims before TBR call
2. Implement reconciliation job for orphaned claims
3. Store TBR response/reference ID for correlation

```typescript
// Create pending record BEFORE TBR call
const pendingRecord = await this.pendingClaimsModel.create({
  subscriberId: subscriber.id,
  status: 'PENDING',
})

try {
  await this.tbrService.postPayment(...)
  pendingRecord.status = 'TBR_SUCCESS'
  await pendingRecord.save()
  // Then DB transaction...
} catch (error) {
  pendingRecord.status = 'TBR_FAILED'
  await pendingRecord.save()
  throw error
}
```

---

### 🟠 High Priority Issues

#### H-1: MachineClientGuard Scope Bypass

**Location:** `apps/legal-gazette-api/src/core/guards/machine-client.guard.ts`

**Description:**  
Uses `user.scope.includes(envScope)` for substring match instead of exact match. A token with scope `@fake/LEGAL_GAZETTE_MACHINE_CLIENT_extended` could bypass.

**Recommendation:**
```typescript
const userScopes = user?.scope?.split(' ') || []
const requiredScope = process.env.LEGAL_GAZETTE_MACHINE_CLIENT_SCOPES
return userScopes.includes(requiredScope)
```

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

| Migration | Description | Priority |
|-----------|-------------|----------|
| Add `pending_tbr_claims` table | Track TBR claims before external call | Critical |
| Add `ON DELETE` constraints | Fix orphan record issues | High |
| Add index on `ADVERT.CASE_ID` | Performance | Medium |
| Add index on `ADVERT.CREATED_BY_NATIONAL_ID` | Performance | Medium |
| Add index on `APPLICATION.CASE_ID` | Performance | Low |

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
| | | | |

---

**Document Owner:** Development Team  
**Last Updated:** December 30, 2025  
**Next Review:** Before production release
