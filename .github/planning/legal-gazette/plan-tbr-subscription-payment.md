# Plan: TBR Subscription Payment Integration

## Summary

Integrate TBR (Tollur og Bókhald Ríkisins) payment system for new Legal Gazette subscriber registrations. When a new user registers (not migrating from legacy system), they should be charged an annual subscription fee.

## Planning Date

December 3, 2025

---

## Background

### Current State

- New subscribers are created with `isActive: false` by default
- Legacy users who migrate get `isActive: true` (their subscription carries over)
- No payment flow exists for new subscribers

### Existing TBR Integration

Reference implementation for advert payments:
- [`advert-published.listener.ts`](../../../apps/legal-gazette-api/src/modules/advert/publications/listeners/advert-published.listener.ts)
- [`TBRService`](../../../apps/legal-gazette-api/src/modules/tbr/tbr.service.ts)

### Requirements

- **Fee Amount:** 3,000 ISK annual subscription fee (lets keep this as env variable)
- **Trigger:** When new subscriber completes registration (not legacy migration)
- **Activation:** Set `isActive: true` upon payment request creation (not payment confirmation)
- **Fee Code:** Different from advert payment fee code (TBD)

---

## Implementation Plan

### Phase 1: Research & Configuration

#### 1.1 Determine TBR Fee Codes

- [x] Identify correct fee code for subscription payments (Using `LG_SUBSCRIPTION_FEE_CODE` env var)
- [x] Identify charge category for subscription payments (Using existing `LG_TBR_CHARGE_CATEGORY_PERSON` and `LG_TBR_CHARGE_CATEGORY_COMPANY`)
- [x] Confirm payment amount (3,000 ISK, configurable via `LG_SUBSCRIPTION_AMOUNT` env var)

#### 1.2 Review Existing TBR Integration

- [x] Understand `TBRService` interface and methods
- [x] Review advert payment flow for reference
- [x] Identify any differences needed for subscription payments

---

### Phase 2: Backend Implementation

#### 2.1 Create Subscription Payment Service

**✅ Implemented:** Using existing `TBRService` via dependency injection in listener

#### 2.2 Integration Points

**✅ Implemented:** Event-based approach (Approach 1)
- [x] Created `SubscriberCreatedEvent` with `isLegacyMigration` flag
- [x] Created `SubscriberCreatedListener` that triggers TBR payment
- [x] Listener only processes payment for non-legacy subscribers
- [x] Similar pattern to `AdvertPublishedListener`

#### 2.3 Subscriber Activation

**✅ Implemented:** Activation happens in listener after successful payment request creation
- [x] `SubscriberCreatedListener` updates `isActive: true` after TBR payment posted
- [x] Legacy migrations skip payment and keep their existing `isActive: true` status

---

### Phase 3: Frontend Updates

#### 3.1 Registration Flow

Update registration page to show:
1. Subscription fee information before registration
2. Success message indicating payment will be processed
3. Clear indication that subscription is now active

#### 3.2 Error Handling

- Display error if TBR payment creation fails
- Provide retry mechanism or contact support option

---

### Phase 4: Testing

- [ ] Unit tests for subscription payment listener
- [ ] Integration test with TBR (dev environment)
- [ ] E2E test of new user registration flow
- [ ] Verify `isActive` is set correctly after payment creation
- [ ] Test legacy migration flow (should skip payment)

---

## Open Questions

1. **✅ Fee Code:** Fee code configured via `LG_SUBSCRIPTION_FEE_CODE` environment variable

2. **✅ Charge Category:** Using existing TBR charge categories for person/company

3. **Payment Confirmation:** Do we need to handle payment confirmation callbacks, or is payment request creation sufficient? _(Currently: activation on request creation)_

4. **Subscription Renewal:** How will annual renewal be handled? _(Out of scope for this plan)_

5. **Refunds:** What happens if a user wants to cancel their subscription? _(Out of scope for this plan)_

---

## Dependencies

- TBR service must be configured and accessible
- Fee codes must be set up in TBR system
- AWS credentials for any notification emails

---

## File Summary

### New Files Created

| File | Type | Description | Status |
|------|------|-------------|--------|
| `subscriber-created.event.ts` | Event | Event emitted when subscriber is created | ✅ Complete |
| `subscriber-created.listener.ts` | Listener | Handles subscription payment on subscriber creation | ✅ Complete |
| `subscriber-payment.model.ts` | Model | Tracks subscription payment records | ✅ Complete |
| `m-20251203-subscriber-payments.js` | Migration | Creates subscriber_payments table | ✅ Complete |

### Files Modified

| File | Changes | Status |
|------|---------|--------|
| `constants.ts` | Added `SUBSCRIBER_CREATED` event and `SUBSCRIBER_PAYMENT` model | ✅ Complete |
| `subscriber.service.ts` | Emit event on subscriber creation (legacy and new) | ✅ Complete |
| `subscriber.provider.module.ts` | Register listener and TBR module | ✅ Complete |
| `app.module.ts` | Register `SubscriberPaymentModel` | ✅ Complete |
| `app/skraning/@register/page.tsx` | Show payment info and success state | 🔲 Not Started |

---

## Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Research & Configuration | ✅ Complete | TBR integration reviewed, fee codes configured via env vars |
| Phase 2: Backend Implementation | ✅ Complete | Event-based listener implemented, payment activation working |
| Phase 2.4: Add `subscribedAt` Tracking | ✅ Complete | Enhancement to track subscription activation date |
| Phase 3: Frontend Updates | 🔲 Not Started | Registration page needs payment info display |
| Phase 4: Testing | 🔲 Not Started | Needs unit tests and E2E testing |

## Environment Variables

The following environment variables must be configured:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LG_SUBSCRIPTION_FEE_CODE` | TBR fee code for subscriptions | `SUBSCRIPTION_FEE` | Yes (set in TBR system) |
| `LG_SUBSCRIPTION_AMOUNT` | Annual subscription fee in ISK | `3000` | No (defaults to 3000) |
| `LG_TBR_CHARGE_CATEGORY_PERSON` | TBR charge category for persons | - | Yes (already exists) |
| `LG_TBR_CHARGE_CATEGORY_COMPANY` | TBR charge category for companies | - | Yes (already exists) |
| `LG_TBR_CREDENTIALS` | TBR API credentials | - | Yes (already exists) |
| `LG_TBR_OFFICE_ID` | TBR office ID | - | Yes (already exists) |
| `LG_TBR_PATH` | TBR API base path | - | Yes (already exists) |

## Implementation Details

### Payment Flow

1. User authenticates via NIS (National ID Service)
2. `SubscriberService.getUserByNationalId()` is called
3. Service checks for existing subscriber
4. If not found, checks for legacy migration eligibility
5. If no legacy user, creates new subscriber with `isActive: false`
6. `SUBSCRIBER_CREATED` event is emitted with `isLegacyMigration: false`
7. `SubscriberCreatedListener` receives event
8. Listener determines charge category (person vs company) from national ID
9. Listener calls `TBRService.postPayment()` to create payment request
10. On success, saves payment record to `subscriber_payments` table
11. Listener updates subscriber `isActive: true`
12. User can now access subscriber features

### Legacy Migration Flow

1. User authenticates via NIS
2. `SubscriberService.getUserByNationalId()` is called
3. Service checks for existing subscriber
4. If not found, checks `autoMigrateByKennitala()`
5. If legacy user found, creates new subscriber with `isActive: true` (inherits from legacy)
6. `SUBSCRIBER_CREATED` event is emitted with `isLegacyMigration: true`
7. `SubscriberCreatedListener` receives event but **skips payment** (logs and returns)
8. User can immediately access subscriber features (no payment needed)

---

## Phase 2.4: Add `subscribedAt` Tracking (Enhancement)

### Overview

Track the exact date/time when a subscriber's subscription became active by adding a `subscribedAt` field to the subscriber model.

### Requirements

- **Field Name:** `subscribedAt` (nullable timestamp)
- **Constraints:**
  - Only set when `isActive` is `true`
  - Should be `null` when `isActive` is `false`
  - Once set, should not be changed (represents initial subscription date)
- **Update Points:**
  - Set when `SubscriberCreatedListener` activates a new subscriber
  - Set when legacy migration creates an active subscriber

### Implementation Tasks

#### Database Changes

- [x] Create migration to add `subscribedAt` column to `legal_gazette_subscribers` table
  - Field: `SUBSCRIBED_AT TIMESTAMP WITH TIME ZONE`
  - Nullable: `true`
  - Default: `null`
  - File: `m-20251203-subscriber-subscribed-at.js`

#### Model Changes

- [x] Update `SubscriberModel` to include `subscribedAt` field
  - Type: `Date | null`
  - Added to `SubscriberAttributes`, `SubscriberCreateAttributes`, and `SubscriberDto`
  - Added to default scope
  - Added column decorator with `field: 'subscribed_at'`

#### Service Changes

- [x] Update `SubscriberCreatedListener.createSubscriptionPayment()`
  - Set `subscribedAt: new Date()` when updating `isActive: true`
  - Updated logging to include subscribedAt timestamp

- [x] Update `LegacyMigrationService.autoMigrateByKennitala()`
  - Set `subscribedAt` using `legacyUser.subscribedAt` (preserves original subscription date from legacy system)
  - Fallback chain: `legacyUser.subscribedAt || legacyUser.createdAt || new Date()`
  - Only set if user is active: `legacyUser.isActive ? legacyUser.subscribedAt || legacyUser.createdAt || new Date() : null`

- [x] Update `LegacyMigrationService.completeMigration()`
  - Set `subscribedAt` using `legacyUser.subscribedAt` (preserves original subscription date from legacy system)
  - Fallback chain: `legacyUser.subscribedAt || legacyUser.createdAt || new Date()`
  - Only updates if not already set (preserves original subscription date)
  - Code: `if (!newSubscriber.subscribedAt && legacyUser.isActive) { newSubscriber.subscribedAt = subscribedAt }`

#### Legacy Data Migration

**Note:** No automatic backfill migration needed.

- Existing subscribers created before this feature will have `subscribedAt = null`
- New logic will set `subscribedAt` automatically:
  - For new subscribers: Set when activated via `SubscriberCreatedListener`
  - For legacy migrations: Set using `legacyUser.createdAt` via `LegacyMigrationService`
- Existing active subscribers can keep `subscribedAt = null` (indicates pre-feature subscribers)

**Migration Strategy:**

No automatic backfill is needed. The field will be populated organically:

1. **New subscribers**: Automatically set via `SubscriberCreatedListener.createSubscriptionPayment()`
2. **Future legacy migrations**: Automatically set via `LegacyMigrationService` using `legacyUser.subscribedAt` (original subscription date from legacy system)
3. **Existing subscribers**: Will have `subscribedAt = null`, which is acceptable and indicates they subscribed before this feature was added

**Optional Manual Backfill (if needed):**

If you need to backfill existing active subscribers in the future, you can run:

```sql
-- Backfill subscribedAt for legacy migrations using legacy subscribedAt field
UPDATE legal_gazette_subscribers s
SET subscribed_at = (
  SELECT COALESCE(ls.subscribed_at, ls.created, ls.migrated_at)
  FROM legacy_subscribers ls
  WHERE ls.migrated_to_subscriber_id = s.id
)
WHERE s.is_active = true
  AND s.subscribed_at IS NULL
  AND EXISTS (
    SELECT 1 FROM legacy_subscribers ls
    WHERE ls.migrated_to_subscriber_id = s.id
  );

-- Backfill subscribedAt for non-legacy active subscribers
UPDATE legal_gazette_subscribers
SET subscribed_at = created
WHERE is_active = true
  AND subscribed_at IS NULL;
```

**Note:** The migration uses `COALESCE(ls.subscribed_at, ls.created, ls.migrated_at)` to:
1. **Prefer** the legacy subscriber's `subscribed_at` (original subscription date from legacy system)
2. **Fall back** to `created` if `subscribed_at` is null
3. **Final fallback** to `migrated_at` as last resort

### Files to Create

| File | Type | Description | Status |
|------|------|-------------|--------|
| `m-20251203-subscriber-subscribed-at.js` | Migration | Add `subscribed_at` column to subscribers | ✅ Complete |
| `m-20251203-legacy-subscriber-subscribed-at.js` | Migration | Add `subscribed_at` column to legacy_subscribers | ✅ Complete |

### Files to Modify

| File | Changes | Status |
|------|---------|--------|
| `subscriber.model.ts` | Add `subscribedAt` field to model and DTO | ✅ Complete |
| `legacy-subscriber.model.ts` | Add `subscribedAt` field to model | ✅ Complete |
| `subscriber-created.listener.ts` | Set `subscribedAt` when activating subscriber | ✅ Complete |
| `legacy-migration.service.ts` | Set `subscribedAt` on auto-migration and magic link migration using legacy `subscribedAt` | ✅ Complete |

### Testing Requirements

- [ ] Unit test: `subscribedAt` is set when new subscriber is activated
- [ ] Unit test: `subscribedAt` is set when legacy user is migrated
- [ ] Unit test: `subscribedAt` is `null` for inactive subscribers
- [ ] Unit test: `subscribedAt` preserves original date on reactivation
- [ ] Unit test: Existing subscribers can have `subscribedAt = null`
- [ ] E2E test: New registration flow sets `subscribedAt` correctly
- [ ] E2E test: Legacy migration preserves original subscription date

### Notes

**Business Logic:**
- `subscribedAt` represents the **first time** a user became an active subscriber
- This is different from `created` (account creation) and `modified` (last update)
- Useful for:
  - Calculating subscription renewal dates
  - Determining subscription age for analytics
  - Auditing subscription history

**Edge Cases:**
- If a subscriber is deactivated and reactivated, `subscribedAt` should **NOT** be updated (keeps original date)
- **Legacy users:** Should use their original `subscribedAt` from the legacy_subscribers table (preserves exact original subscription date)
- **Fallback chain for legacy users:** `legacyUser.subscribedAt` → `legacyUser.createdAt` → `new Date()`
- **Pre-feature subscribers:** Existing subscribers created before this feature will have `subscribedAt = null`, which is acceptable and indicates they were created before subscription date tracking was implemented

**Legacy Data Import:**
- The `subscribedAt` field must be included when importing legacy subscriber data
- See [Legacy Data Import Plan](./plan-legacy-data-import.md) for details on importing legacy subscription dates

---

## Related Plans

- [Legacy Subscriber Migration](./plan-legacy-subscriber-migration.md) - Migration flow (complete, no payment needed for migrated users)
