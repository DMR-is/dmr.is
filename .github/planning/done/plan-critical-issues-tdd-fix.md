# Plan: Critical Issues TDD Fix

> **Created:** January 2, 2026  
> **Target Completion:** January 10, 2026  
> **Completed:** January 8, 2026  
> **Status:** ✅ Complete (All Critical Issues Resolved)  
> **Last Updated:** January 9, 2026  
> **Approach:** Test-Driven Development (TDD)

---

## Overview

This plan outlines a TDD approach to fixing the 5 critical issues identified in the code review. For each issue, we will:

1. **Write failing tests** that demonstrate the bug
2. **Verify the tests fail** (red)
3. **Implement the fix**
4. **Verify the tests pass** (green)
5. **Refactor if needed**

---

## Critical Issues Summary

| ID | Issue | Location | Impact | Status |
|----|-------|----------|--------|--------|
| C-1 | Published Adverts Can Be Modified | `advert.service.ts` | Data integrity violation | ✅ Complete |
| C-2 | Publishing Before Payment Confirmation | `publication.service.ts` | Business model bypass | ✅ Complete (via H-17) |
| C-3 | Race Condition - Duplicate Payments | `subscriber.service.ts` | Double-charging users | ✅ Complete |
| C-4 | Orphaned TBR Claims (Subscriber) | `subscriber-created.listener.ts` | Untracked payments | ✅ Complete |
| C-5 | Orphaned TBR Claims (Advert) | `advert-published.listener.ts` | Untracked payments | ✅ Complete |

---

## Phase 1: C-1 - Published Adverts Modification Prevention

### Problem Statement

The `updateAdvert` method in `advert.service.ts` allows modifying published adverts without checking the status. Published adverts are legally binding documents that should not be modifiable.

### Current Code Location

[apps/legal-gazette-api/src/modules/advert/advert.service.ts](apps/legal-gazette-api/src/modules/advert/advert.service.ts) - `updateAdvert` method (line ~361)

### Test Plan

**Test File:** `apps/legal-gazette-api/src/modules/advert/advert.service.spec.ts`

#### Test Cases

```typescript
describe('updateAdvert', () => {
  describe('when advert is published', () => {
    it('should throw BadRequestException when trying to modify title', async () => {
      // Setup: Create mock advert with PUBLISHED status
      // Action: Call updateAdvert with new title
      // Assert: Should throw BadRequestException with message 'Cannot modify published adverts'
    })

    it('should throw BadRequestException when trying to modify content', async () => {
      // Same pattern for content field
    })

    it('should throw BadRequestException when trying to modify category', async () => {
      // Same pattern for category field
    })

    it('should throw BadRequestException when trying to modify type', async () => {
      // Same pattern for type field
    })
  })

  describe('when advert is not published', () => {
    it('should allow modification when status is SUBMITTED', async () => {
      // Setup: Create mock advert with SUBMITTED status
      // Action: Call updateAdvert with new title
      // Assert: Should succeed and return updated advert
    })

    it('should allow modification when status is IN_PROGRESS', async () => {
      // Same pattern for IN_PROGRESS status
    })

    it('should allow modification when status is READY_FOR_PUBLICATION', async () => {
      // Same pattern for READY_FOR_PUBLICATION status
    })
  })
})
```

### Implementation

```typescript
// In advert.service.ts - updateAdvert method
async updateAdvert(id: string, body: UpdateAdvertDto): Promise<AdvertDetailedDto> {
  const advert = await this.advertModel.withScope('detailed').findByPkOrThrow(id)
  
  // NEW: Prevent modification of published adverts
  if (advert.statusId === StatusIdEnum.PUBLISHED) {
    throw new BadRequestException('Cannot modify published adverts')
  }
  
  // ... rest of existing logic
}
```

### Status

| Step | Status | Notes |
|------|--------|-------|
| Write test file | ✅ Complete | `advert.service.spec.ts` created |
| Verify tests fail | ✅ Complete | 7 tests failed as expected |
| Implement fix | ✅ Complete | Added status check in `updateAdvert` |
| Verify tests pass | ✅ Complete | All 12 tests pass (411 lines) |
| Code review | ✅ Complete | Merged January 7, 2026 |

---

## Phase 2: C-2 - Publishing Before Payment Confirmation

### Problem Statement

The `publishAdverts` method in `publication.service.ts` only checks `statusId` but doesn't verify that payment has been confirmed. This allows publishing without payment.

### Current Code Location

[apps/legal-gazette-api/src/modules/advert/publications/publication.service.ts](apps/legal-gazette-api/src/modules/advert/publications/publication.service.ts) - `publishAdverts` method (line ~88)

### Test Plan

**Test File:** `apps/legal-gazette-api/src/modules/advert/publications/publication.service.spec.ts`

#### Test Cases

```typescript
describe('publishAdverts', () => {
  describe('payment validation', () => {
    it('should throw BadRequestException when payment is required but not confirmed', async () => {
      // Setup: Create mock advert requiring payment but transaction.paidAt is null
      // Action: Call publishAdverts
      // Assert: Should throw 'Payment required before publishing advert {id}'
    })

    it('should throw BadRequestException when payment is required and transaction is missing', async () => {
      // Setup: Create mock advert requiring payment with no transaction record
      // Action: Call publishAdverts
      // Assert: Should throw appropriate error
    })

    it('should succeed when payment is confirmed', async () => {
      // Setup: Create mock advert with confirmed payment (paidAt is set)
      // Action: Call publishAdverts
      // Assert: Should publish successfully
    })

    it('should succeed when payment is not required (exempt category)', async () => {
      // Setup: Create mock advert in exempt category (e.g., government)
      // Action: Call publishAdverts
      // Assert: Should publish without payment check
    })
  })

  describe('batch publishing with payment issues', () => {
    it('should not publish any adverts if one has unpaid payment', async () => {
      // Setup: Create 3 adverts, 2 paid, 1 unpaid
      // Action: Call publishAdverts with all 3
      // Assert: Should throw error, none should be published
    })
  })
})
```

### Implementation

```typescript
// In publication.service.ts - publishAdverts method
async publishAdverts(advertIds: string[]): Promise<void> {
  const adverts = await this.advertModel.findAll({
    attributes: ['id', 'publicationNumber', 'statusId', 'categoryId'],
    include: [
      {
        model: AdvertPublicationModel,
        required: true,
        limit: 1,
      },
      {
        model: TBRTransactionModel,
        as: 'transaction',
        required: false,
      },
    ],
    where: {
      id: { [Op.in]: advertIds },
      statusId: { [Op.eq]: StatusIdEnum.READY_FOR_PUBLICATION },
    },
  })

  // NEW: Validate payment before publishing
  for (const advert of adverts) {
    if (this.isPaymentRequired(advert) && !advert.transaction?.paidAt) {
      throw new BadRequestException(
        `Payment required before publishing advert ${advert.id}`
      )
    }
  }

  // ... rest of existing logic
}

// NEW: Helper method to determine if payment is required
private isPaymentRequired(advert: AdvertModel): boolean {
  // TODO: Define business rules for exempt categories
  const exemptCategories = ['GOVERNMENT', 'COURT']
  return !exemptCategories.includes(advert.category?.slug || '')
}
```

### Dependencies

- Need to clarify exempt categories with stakeholders
- May need to add `transaction` association to advert model if not present

### Status

| Step | Status | Notes |
|------|--------|-------|
| Clarify exempt categories | ✅ Complete | Business review confirmed NO payment-exempt categories (Jan 8, 2026) |
| Write test file | ✅ Complete | 4 tests in `publication.service.spec.ts` (via H-17) |
| Verify tests fail | ✅ Complete | Tests failed before H-17 implementation |
| Implement fix | ✅ Complete | Payment validation added to `publishAdvertPublication()` |
| Verify tests pass | ✅ Complete | All 17 tests pass |
| Code review | ✅ Complete | Merged January 8, 2026 |

### Final Implementation (via H-17)

**Resolution Date:** January 8, 2026  
**Implementation:** Payment validation added to `publishAdvertPublication()` in `publication.service.ts`

**Business Decision:** Business stakeholders confirmed that ALL adverts require TBR transactions with confirmed payment before publishing. There are NO payment-exempt categories.

**Code Changes:**
```typescript
async publishAdvertPublication(advertId: string, publicationId: string): Promise<void> {
  await this.sequelize.transaction(async (t) => {
    // ... fetch advert with category and transaction includes

    // Validate payment for first publication (version A)
    if (publication.versionNumber === 1) {
      await this.validatePaymentBeforePublish(advert)
    }

    // ... rest of publishing logic
  })
}

private async validatePaymentBeforePublish(advert: AdvertModel): Promise<void> {
  // Business decision: ALL adverts require payment (no exempt categories)
  if (!advert.transaction || !advert.transaction.paidAt) {
    throw new BadRequestException(
      `Payment must be confirmed before publishing. Transaction ${advert.transaction?.id || 'not found'}`
    )
  }
}
```

**Test Coverage:**
- ✅ Payment required when not paid → throws BadRequestException
- ✅ Transaction missing error → throws appropriate error
- ✅ Success when paid → publishes successfully
- ✅ Version B skips validation → subsequent versions don't need payment check

**Notes:**
- Validation only applies to first publication (version A)
- Subsequent versions (B, C, etc.) skip payment check as original payment covers all versions
- Implementation resolves both C-2 (payment validation) and H-17 (business logic gap)

---

## Phase 3: C-3 - Race Condition: Duplicate Payment Requests

### Problem Statement

The `createSubscriptionForUser` method doesn't check for existing pending/active subscriptions before emitting the payment event. Rapid requests (double-click, retry) can create duplicate TBR claims.

### Current Code Location

[apps/legal-gazette-api/src/modules/subscribers/subscriber.service.ts](apps/legal-gazette-api/src/modules/subscribers/subscriber.service.ts) - `createSubscriptionForUser` method (line ~58)

### Test Plan

**Test File:** `apps/legal-gazette-api/src/modules/subscribers/subscriber.service.spec.ts`

#### Test Cases

```typescript
describe('createSubscriptionForUser', () => {
  describe('duplicate request prevention', () => {
    it('should return success without creating payment when subscription is active and not expired', async () => {
      // Setup: Create mock subscriber with isActive=true, subscribedTo=future date
      // Action: Call createSubscriptionForUser
      // Assert: Should return { success: true } without emitting event
    })

    it('should return success without creating payment for immediate duplicate request', async () => {
      // Setup: Create mock subscriber with pending payment (created within last N seconds)
      // Action: Call createSubscriptionForUser twice in quick succession
      // Assert: Second call should return success without creating duplicate
    })

    it('should allow renewal when subscription is expired', async () => {
      // Setup: Create mock subscriber with isActive=true, subscribedTo=past date
      // Action: Call createSubscriptionForUser
      // Assert: Should emit event for new payment
    })

    it('should allow subscription creation for inactive subscriber', async () => {
      // Setup: Create mock subscriber with isActive=false
      // Action: Call createSubscriptionForUser
      // Assert: Should emit event for payment
    })
  })

  describe('idempotency', () => {
    it('should be idempotent for same request within window', async () => {
      // Setup: Configure idempotency window
      // Action: Call createSubscriptionForUser twice with same nationalId
      // Assert: Only one payment event emitted
    })
  })
})
```

### Implementation Options

#### Option A: Simple Status Check (Recommended for MVP)

```typescript
async createSubscriptionForUser(user: DMRUser): Promise<MutationResponse> {
  const subscriber = await this.subscriberModel.findOne({
    where: { nationalId: user.nationalId },
  })

  if (!subscriber) {
    throw new NotFoundException(`Subscriber with nationalId not found.`)
  }

  // NEW: Check for active subscription
  if (subscriber.isActive && subscriber.subscribedTo) {
    const expiryDate = new Date(subscriber.subscribedTo)
    if (expiryDate > new Date()) {
      this.logger.info('Subscription already active, skipping payment creation', {
        subscriberId: subscriber.id,
        subscribedTo: subscriber.subscribedTo,
      })
      return { success: true }
    }
  }

  // ... rest of existing logic
}
```

#### Option B: Distributed Lock with Redis (Full Solution)

```typescript
async createSubscriptionForUser(user: DMRUser): Promise<MutationResponse> {
  const lockKey = `subscription:create:${user.nationalId}`
  
  const lock = await this.redis.set(lockKey, '1', 'NX', 'EX', 30)
  if (!lock) {
    this.logger.warn('Concurrent subscription request blocked', {
      nationalId: user.nationalId,
    })
    return { success: true } // Idempotent response
  }

  try {
    // ... existing logic
  } finally {
    await this.redis.del(lockKey)
  }
}
```

### Recommendation

Start with Option A for immediate fix. Option B can be added in a follow-up phase if concurrent issues persist.

### Status

| Step | Status | Notes |
|------|--------|-------|
| Write test file | ✅ Complete | `subscriber.service.spec.ts` created with 12 test cases |
| Verify tests fail | ✅ Complete | 3 tests failed as expected |
| Implement Option A fix | ✅ Complete | Added active subscription check before emitting event |
| Implement Option B lock | ✅ Complete | Added `runWithUserLock()` in `lock.service.ts` and wrapped `createSubscriptionForUser` |
| Verify tests pass | ✅ Complete | Tests pass with advisory lock implementation |
| Code review | ✅ Complete | Merged January 7, 2026 |

---

## Phase 4: C-4 - Orphaned TBR Claims (Subscriber)

### Problem Statement

The `SubscriberCreatedListener` calls TBR first (irreversible), then performs DB operations. If DB fails, there's an orphaned TBR claim with no database record.

### Current Code Location

[apps/legal-gazette-api/src/modules/subscribers/listeners/subscriber-created.listener.ts](apps/legal-gazette-api/src/modules/subscribers/listeners/subscriber-created.listener.ts) - `createSubscriptionPayment` method

### Current Flow (Problematic)

```
1. Call TBR API (creates claim) ← CANNOT ROLLBACK
2. Start DB transaction
3. Create payment record
4. Update subscriber
5. Commit transaction ← IF FAILS, TBR CLAIM IS ORPHANED
```

### Proposed Flow (Safe)

```
1. Start DB transaction
2. Create PENDING payment record with unique reference
3. Commit transaction
4. Call TBR API with reference
5. Update payment record with TBR response
   - If TBR succeeds: Update to CONFIRMED
   - If TBR fails: Update to FAILED (can retry later)
```

### Database Migration Required

```sql
-- Add status column to subscriber_payment table
ALTER TABLE subscriber_payment ADD COLUMN status TEXT DEFAULT 'PENDING' NOT NULL;
ALTER TABLE subscriber_payment ADD COLUMN tbr_reference TEXT;
ALTER TABLE subscriber_payment ADD COLUMN tbr_error TEXT;
```

### Test Plan

**Test File:** `apps/legal-gazette-api/src/modules/subscribers/listeners/subscriber-created.listener.spec.ts`

#### Test Cases

```typescript
describe('createSubscriptionPayment - Orphan Prevention', () => {
  describe('normal flow', () => {
    it('should create pending record before TBR call', async () => {
      // Setup: Mock successful TBR response
      // Action: Call createSubscriptionPayment
      // Assert: Payment record created with status=PENDING before TBR call
    })

    it('should update record to CONFIRMED after successful TBR call', async () => {
      // Setup: Mock successful TBR response
      // Action: Call createSubscriptionPayment
      // Assert: Payment record updated to status=CONFIRMED
    })
  })

  describe('TBR failure handling', () => {
    it('should update record to FAILED when TBR call fails', async () => {
      // Setup: Mock TBR failure
      // Action: Call createSubscriptionPayment
      // Assert: Payment record updated to status=FAILED with error message
    })

    it('should not leave orphaned records when TBR fails', async () => {
      // Setup: Mock TBR failure
      // Action: Call createSubscriptionPayment
      // Assert: Payment record exists with FAILED status (can be retried)
    })
  })

  describe('database failure handling', () => {
    it('should not call TBR if initial record creation fails', async () => {
      // Setup: Mock DB failure on create
      // Action: Call createSubscriptionPayment
      // Assert: TBR not called, error thrown
    })
  })

  describe('reconciliation support', () => {
    it('should store TBR reference for correlation', async () => {
      // Setup: Mock successful TBR response with reference
      // Action: Call createSubscriptionPayment
      // Assert: TBR reference stored in payment record
    })
  })
})
```

### Implementation

```typescript
@OnEvent(LegalGazetteEvents.SUBSCRIBER_CREATED, { suppressErrors: false })
async createSubscriptionPayment({
  subscriber,
  actorNationalId,
}: SubscriberCreatedEvent) {
  const isCompany = Kennitala.isCompany(subscriber.nationalId)
  const chargeCategory = isCompany
    ? process.env.LG_TBR_CHARGE_CATEGORY_COMPANY
    : process.env.LG_TBR_CHARGE_CATEGORY_PERSON

  const chargeBase = subscriber.id
  const reference = `SUB-${subscriber.id}-${Date.now()}`

  // Step 1: Create PENDING payment record BEFORE TBR call
  const paymentRecord = await this.subscriberPaymentModel.create({
    subscriberId: subscriber.id,
    activatedByNationalId: actorNationalId,
    amount: SUBSCRIPTION_AMOUNT,
    chargeBase,
    chargeCategory,
    feeCode: SUBSCRIPTION_FEE_CODE,
    status: 'PENDING',
    paidAt: null,
  })

  // Step 2: Call TBR API
  try {
    const tbrResponse = await this.tbrService.postPayment({
      advertId: subscriber.id,
      chargeCategory,
      chargeBase,
      debtorNationalId: subscriber.nationalId,
      reference, // Include for correlation
      expenses: [
        {
          feeCode: SUBSCRIPTION_FEE_CODE,
          reference: `Áskrift - ${subscriber.nationalId}`,
          quantity: 1,
          unitPrice: SUBSCRIPTION_AMOUNT,
          sum: SUBSCRIPTION_AMOUNT,
        },
      ],
    })

    // Step 3: Update record to CONFIRMED
    await this.sequelize.transaction(async (transaction) => {
      await paymentRecord.update(
        { status: 'CONFIRMED', tbrReference: tbrResponse?.reference },
        { transaction }
      )

      // Activate subscriber
      await this.subscriberModel.update(
        { isActive: true, subscribedTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
        { where: { id: subscriber.id }, transaction }
      )
    })
  } catch (error) {
    // Step 3 (error): Mark as FAILED for retry
    await paymentRecord.update({
      status: 'FAILED',
      tbrError: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}
```

### Status

| Step | Status | Notes |
|------|--------|-------|
| Create migration | ✅ Complete | `m-20260106-tbr-transaction-consolidation.js` |
| Update SubscriberPaymentModel | ✅ Complete | Refactored to `SubscriberTransactionModel` with `status` fields |
| Write test file | ✅ Complete | Comprehensive tests in `subscriber-created.listener.spec.ts` (692 lines) |
| Verify tests fail | ✅ Complete | Tests failed before implementation |
| Implement fix | ✅ Complete | PENDING → TBR → CREATED/FAILED pattern |
| Verify tests pass | ✅ Complete | All listener tests pass |
| Add reconciliation job | ⬜ Backlog | Retry PENDING/FAILED records |
| Code review | ✅ Complete | Merged January 7, 2026 |

---

## Phase 5: C-5 - Orphaned TBR Claims (Advert)

### Problem Statement

Similar to C-4, the `AdvertPublishedListener.createTBRTransaction` calls TBR first, then creates the database record. If DB fails, there's an orphaned TBR claim.

### Current Code Location

[apps/legal-gazette-api/src/modules/advert/publications/listeners/advert-published.listener.ts](apps/legal-gazette-api/src/modules/advert/publications/listeners/advert-published.listener.ts) - `createTBRTransaction` method

### Current Flow (Problematic)

```
1. Calculate payment data
2. Call TBR API (creates claim) ← CANNOT ROLLBACK
3. Create TBRTransaction record ← IF FAILS, TBR CLAIM IS ORPHANED
```

### Proposed Flow (Safe)

```
1. Calculate payment data
2. Create PENDING TBRTransaction record
3. Call TBR API
4. Update record:
   - Success: status=CONFIRMED
   - Failure: status=FAILED (can retry later)
```

### Database Migration Required

```sql
-- Add status column to tbr_transaction table
ALTER TABLE tbr_transaction ADD COLUMN status TEXT DEFAULT 'PENDING' NOT NULL;
ALTER TABLE tbr_transaction ADD COLUMN tbr_reference TEXT;
ALTER TABLE tbr_transaction ADD COLUMN tbr_error TEXT;
```

### Test Plan

**Test File:** `apps/legal-gazette-api/src/modules/advert/publications/listeners/advert-published.listener.spec.ts`

#### Test Cases

```typescript
describe('createTBRTransaction - Orphan Prevention', () => {
  describe('normal flow', () => {
    it('should create pending transaction record before TBR call', async () => {
      // Setup: Mock successful TBR response
      // Action: Emit ADVERT_PUBLISHED event
      // Assert: Transaction record created with status=PENDING before TBR call
    })

    it('should update record to CONFIRMED after successful TBR call', async () => {
      // Setup: Mock successful TBR response
      // Action: Emit ADVERT_PUBLISHED event
      // Assert: Transaction record updated to status=CONFIRMED
    })
  })

  describe('TBR failure handling', () => {
    it('should update record to FAILED when TBR call fails', async () => {
      // Setup: Mock TBR failure
      // Action: Emit ADVERT_PUBLISHED event
      // Assert: Transaction record updated to status=FAILED
    })
  })

  describe('skip condition', () => {
    it('should not create transaction for non-A versions', async () => {
      // Setup: Create event with version B
      // Action: Emit ADVERT_PUBLISHED event
      // Assert: No transaction created, no TBR call
    })

    it('should not create transaction when no expenses', async () => {
      // Setup: Mock priceCalculator returning empty expenses
      // Action: Emit ADVERT_PUBLISHED event
      // Assert: No transaction created, no TBR call
    })
  })
})
```

### Implementation

```typescript
@OnEvent(LegalGazetteEvents.ADVERT_PUBLISHED)
async createTBRTransaction({ advert, publication }: AdvertPublishedEvent) {
  if (publication.version !== AdvertVersionEnum.A) return

  const { feeCodeId, paymentData } =
    await this.priceCalculatorService.getPaymentData(advert.id)

  if (paymentData.expenses.length === 0) {
    this.logger.warn('No expenses found, skipping TBR transaction', {
      advertId: advert.id,
    })
    return
  }

  const expenses = paymentData.expenses[0]

  // Step 1: Create PENDING transaction record BEFORE TBR call
  const transaction = await this.tbrTransactionModel.create({
    advertId: advert.id,
    feeCodeId: feeCodeId,
    feeCodeMultiplier: expenses.quantity,
    totalPrice: expenses.sum,
    chargeCategory: paymentData.chargeCategory,
    chargeBase: paymentData.chargeBase,
    status: 'PENDING',
  })

  // Step 2: Call TBR API
  try {
    const tbrResponse = await this.tbrService.postPayment(paymentData)

    // Step 3: Update to CONFIRMED
    await transaction.update({
      status: 'CONFIRMED',
      tbrReference: tbrResponse?.reference,
    })

    this.logger.info('TBR transaction confirmed', {
      advertId: advert.id,
      transactionId: transaction.id,
    })
  } catch (error) {
    // Step 3 (error): Mark as FAILED for retry
    await transaction.update({
      status: 'FAILED',
      tbrError: error instanceof Error ? error.message : 'Unknown error',
    })

    this.logger.error('TBR transaction failed', {
      advertId: advert.id,
      transactionId: transaction.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    
    // Note: We don't throw here as publication already happened
    // Failed payments should be handled by reconciliation job
  }
}
```

### Status

| Step | Status | Notes |
|------|--------|-------|
| Create migration | ✅ Complete | Same migration as C-4: `m-20260106-tbr-transaction-consolidation.js` |
| Update TBRTransactionModel | ✅ Complete | Added `status`, `tbrReference`, `tbrError`, `transactionType` fields |
| Write test file | ✅ Complete | Comprehensive tests in `advert-published.listener.spec.ts` |
| Verify tests fail | ✅ Complete | Tests failed before implementation |
| Implement fix | ✅ Complete | PENDING → TBR → CREATED/FAILED pattern |
| Verify tests pass | ✅ Complete | All listener tests pass |
| Add reconciliation job | ⬜ Backlog | Retry PENDING/FAILED records |
| Code review | ✅ Complete | Merged January 7, 2026 |

---

## Implementation Order

Based on dependencies and impact, implement in this order:

| Order | Issue | Reason |
|-------|-------|--------|
| 1 | C-1 | Simplest fix, no dependencies |
| 2 | C-3 | Prevents new duplicate payments while other fixes are in progress |
| 3 | C-4 & C-5 | Can be done together, similar pattern |
| 4 | C-2 | Requires clarification on exempt categories |

---

## Database Migrations Summary

### Migration 1: Subscriber Payment Status

**File:** `m-20260102-subscriber-payment-status.js`

```javascript
'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;
      
      ALTER TABLE subscriber_payment 
        ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'CONFIRMED' NOT NULL;
      
      ALTER TABLE subscriber_payment 
        ADD COLUMN IF NOT EXISTS tbr_reference TEXT;
      
      ALTER TABLE subscriber_payment 
        ADD COLUMN IF NOT EXISTS tbr_error TEXT;
      
      -- Set existing records to CONFIRMED (they were already processed)
      UPDATE subscriber_payment SET status = 'CONFIRMED' WHERE status = 'PENDING';
      
      COMMIT;
    `)
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;
      ALTER TABLE subscriber_payment DROP COLUMN IF EXISTS status;
      ALTER TABLE subscriber_payment DROP COLUMN IF EXISTS tbr_reference;
      ALTER TABLE subscriber_payment DROP COLUMN IF EXISTS tbr_error;
      COMMIT;
    `)
  },
}
```

### Migration 2: TBR Transaction Status

**File:** `m-20260102-tbr-transaction-status.js`

```javascript
'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;
      
      ALTER TABLE tbr_transaction 
        ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'CONFIRMED' NOT NULL;
      
      ALTER TABLE tbr_transaction 
        ADD COLUMN IF NOT EXISTS tbr_reference TEXT;
      
      ALTER TABLE tbr_transaction 
        ADD COLUMN IF NOT EXISTS tbr_error TEXT;
      
      -- Set existing records to CONFIRMED (they were already processed)
      UPDATE tbr_transaction SET status = 'CONFIRMED' WHERE status = 'PENDING';
      
      COMMIT;
    `)
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;
      ALTER TABLE tbr_transaction DROP COLUMN IF EXISTS status;
      ALTER TABLE tbr_transaction DROP COLUMN IF EXISTS tbr_reference;
      ALTER TABLE tbr_transaction DROP COLUMN IF EXISTS tbr_error;
      COMMIT;
    `)
  },
}
```

---

## Testing Checklist

### Before Production Release

- [x] All critical issue tests pass (C-1, C-2, C-3, C-4, C-5)
- [x] Manual testing of each fixed flow
- [x] Load testing for race conditions (C-3, C-4, C-5)
- [x] Verify no regression in existing functionality
- [x] Test payment flow end-to-end
- [x] Verify TBR integration with test credentials
- [x] C-2 implementation complete (H-17 + business review)

### Test Commands

```bash
# Run tests for advert service
nx test legal-gazette-api --testPathPattern="advert.service.spec"

# Run tests for publication service
nx test legal-gazette-api --testPathPattern="publication.service.spec"

# Run tests for subscriber service
nx test legal-gazette-api --testPathPattern="subscriber.service.spec"

# Run tests for listeners
nx test legal-gazette-api --testPathPattern="listener.spec"

# Run all tests
nx test legal-gazette-api
```

---

## Progress Tracking

| Date | Phase | Status | Notes |
|------|-------|--------|-------|
| Jan 2, 2026 | Plan Created | ✅ Complete | |
| Jan 2, 2026 | C-1 Tests | ✅ Complete | 7 test cases for published/rejected/withdrawn adverts |
| Jan 2, 2026 | C-1 Fix | ✅ Complete | Added status check in `updateAdvert` method |
| Jan 3, 2026 | C-3 Tests | ✅ Complete | 12 test cases with advisory lock tests |
| Jan 3, 2026 | C-3 Fix | ✅ Complete | Advisory lock + active subscription check |
| Jan 5, 2026 | C-4/C-5 Migration | ✅ Complete | `m-20260106-tbr-transaction-consolidation.js` |
| Jan 5, 2026 | C-4/C-5 Tests | ✅ Complete | Comprehensive listener tests (692 lines + additional) |
| Jan 6, 2026 | C-4/C-5 Fix | ✅ Complete | PENDING → TBR → CREATED/FAILED pattern |
| Jan 8, 2026 | C-2 Business Review | ✅ Complete | Confirmed NO payment-exempt categories |
| Jan 8, 2026 | C-2 Implementation | ✅ Complete | H-17 - Payment validation before publish |
| Jan 8, 2026 | C-2 Tests | ✅ Complete | 4 tests in publication.service.spec.ts |
| Jan 7, 2026 | Final Verification | ✅ Complete | All 5 critical issues tested and merged |

---

## Open Questions

~~1. **C-2**: What categories are exempt from payment? (Government, Court, etc.)~~ - ✅ **RESOLVED: Business review confirmed NO payment-exempt categories (Jan 8, 2026)**
2. ~~**C-4/C-5**: Should we implement a reconciliation job immediately or as a follow-up?~~ - ✅ **ANSWERED: Follow-up (backlog)**
3. ~~**C-3**: Should we use Redis for distributed locking, or is the simple check sufficient?~~ - ✅ **ANSWERED: PostgreSQL advisory locks (implemented in `lock.service.ts`)**
4. ~~**TBR API**: Does TBR support idempotency keys to prevent duplicate claims?~~ - ✅ **ANSWERED: Using PENDING status pattern instead**

## Completion Summary

**Implementation completed:** January 8, 2026

### What Was Implemented

- **C-1 (Published Adverts)**: 411 lines of tests, status check prevents modification of PUBLISHED/REJECTED/WITHDRAWN adverts
- **C-2 (Payment Validation)**: Payment validation before publishing implemented via H-17. Business review confirmed ALL adverts require payment (no exempt categories). 4 tests verify all scenarios.
- **C-3 (Race Conditions)**: PostgreSQL advisory locks (`runWithUserLock`) prevent duplicate payments, active subscription check for idempotency
- **C-4 (Subscriber Orphan Prevention)**: PENDING → TBR call → CREATED/FAILED pattern with 692 lines of comprehensive tests
- **C-5 (Advert Orphan Prevention)**: Same pattern as C-4, both use consolidated `tbr_transaction` table
- **Database Migration**: `m-20260106-tbr-transaction-consolidation.js` consolidates payment tracking with status fields

### What Remains

- ~~**C-2 (Payment Validation)**~~ - ✅ **COMPLETE (Jan 8, 2026)**
- **Reconciliation Job**: Backlog item to retry PENDING/FAILED transactions

---

**Document Owner:** Development Team  
**Last Updated:** January 2, 2026  
**Next Review:** Before implementation of each phase
