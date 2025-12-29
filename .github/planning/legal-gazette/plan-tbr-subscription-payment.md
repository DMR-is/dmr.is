# Plan: TBR Subscription Payment Integration

## Summary

Integrate TBR (Tollur og Bókhald Ríkisins) payment system for Legal Gazette subscriber registrations. When a user subscribes, they are charged an annual subscription fee via TBR.

## Planning Date

December 3, 2025  
**Last Updated:** December 29, 2025

---

## Background

### Current State

- New subscribers are created with `isActive: false` by default
- No payment flow existed for new subscribers (now implemented)
- Subscription activation happens after successful TBR payment request

### Existing TBR Integration

Reference implementation for advert payments:
- [`advert-published.listener.ts`](../../../apps/legal-gazette-api/src/modules/advert/publications/listeners/advert-published.listener.ts)
- [`TBRService`](../../../apps/legal-gazette-api/src/modules/tbr/tbr.service.ts)

### Requirements

- **Fee Amount:** 4,500 ISK annual subscription fee (configurable via env variable)
- **Trigger:** When subscriber initiates subscription purchase
- **Activation:** Set `isActive: true` after successful TBR payment request creation
- **Fee Code:** Configured via `LG_SUBSCRIPTION_FEE_CODE` environment variable (default: `RL401`)

---

## Implementation Plan

### Phase 1: Research & Configuration ✅ Complete

#### 1.1 Determine TBR Fee Codes

- [x] Identify correct fee code for subscription payments (Using `LG_SUBSCRIPTION_FEE_CODE` env var, default `RL401`)
- [x] Identify charge category for subscription payments (Using existing `LG_TBR_CHARGE_CATEGORY_PERSON` and `LG_TBR_CHARGE_CATEGORY_COMPANY`)
- [x] Confirm payment amount (4,500 ISK, configurable via `LG_SUBSCRIPTION_AMOUNT` env var)

#### 1.2 Review Existing TBR Integration

- [x] Understand `TBRService` interface and methods
- [x] Review advert payment flow for reference
- [x] Identify any differences needed for subscription payments

---

### Phase 2: Backend Implementation ✅ Complete

#### 2.1 Create Subscription Payment Service

**✅ Implemented:** Using existing `TBRService` via dependency injection in listener

#### 2.2 Integration Points

**✅ Implemented:** Event-based approach
- [x] Created `SubscriberCreatedEvent` with `actorNationalId` field
- [x] Created `SubscriberCreatedListener` that triggers TBR payment
- [x] Similar pattern to `AdvertPublishedListener`

#### 2.3 Subscriber Activation

**✅ Implemented:** Activation happens in listener after successful payment request creation
- [x] Service emits event (does NOT activate subscriber)
- [x] `SubscriberCreatedListener` calls TBR, saves payment, then updates subscriber
- [x] Sets `isActive: true`, `subscribedTo` (1 year from now)
- [x] Only sets `subscribedFrom` if not already set (preserved on renewals)

#### 2.4 Subscription Date Tracking

**✅ Implemented:** Two-field approach for subscription dates
- `subscribedFrom`: First day of subscription (set once, never updated on renewal)
- `subscribedTo`: Subscription expiry date (always updated on purchase/renewal to now + 1 year)

#### 2.5 Payment Actor Tracking

**✅ Implemented:** Track who initiated the subscription
- [x] Added `activatedByNationalId` field to `SubscriberPaymentModel`
- [x] Uses `actor.nationalId` if delegation exists, otherwise `user.nationalId`
- [x] Supports renewals (no UNIQUE constraint on subscriber_id)

---

### Phase 3: Transaction Boundaries & Robustness 🔲 Not Started

#### 3.1 Add Transaction Boundaries

Wrap database operations in the listener with a transaction to ensure atomicity:
- [ ] Create payment record and update subscriber in a single transaction
- [ ] If any DB operation fails after TBR call, log error and handle gracefully
- [ ] Consider idempotency key for TBR calls to handle retries

#### 3.2 Error Recovery

- [ ] Handle partial failures (TBR succeeds but DB fails)
- [ ] Add retry mechanism for transient failures
- [ ] Log all payment attempts for auditing

---

### Phase 4: Unit Tests 🔲 Not Started

#### 4.1 Listener Tests

- [ ] `SubscriberCreatedListener` creates TBR payment correctly
- [ ] `SubscriberCreatedListener` saves payment record with `activatedByNationalId`
- [ ] `SubscriberCreatedListener` sets `subscribedFrom` only if null
- [ ] `SubscriberCreatedListener` always updates `subscribedTo`
- [ ] `SubscriberCreatedListener` handles TBR errors gracefully
- [ ] Transaction rollback works correctly on failure

#### 4.2 Service Tests

- [ ] `SubscriberService` does NOT activate subscriber (only emits event)
- [ ] `SubscriberService` correctly determines actor nationalId
- [ ] `SubscriberService` handles missing subscriber correctly

#### 4.3 Utility Tests

- [ ] `isCompanyNationalId` correctly identifies company vs person

---

### Phase 5: Frontend Updates 🔲 Not Started

#### 5.1 Registration Flow

Update registration page to show:
1. Subscription fee information before registration
2. Call `createSubscription` mutation on form submit
3. Success message indicating payment will be processed
4. Clear indication that subscription is now active

#### 5.2 Session Refresh

- Call `update()` on session after successful subscription to reflect `isActive: true`

#### 5.3 Error Handling

- Display error if TBR payment creation fails
- Provide retry mechanism or contact support option

---

## Open Questions

1. **✅ Fee Code:** Fee code configured via `LG_SUBSCRIPTION_FEE_CODE` environment variable (default: `RL401`)

2. **✅ Charge Category:** Using existing TBR charge categories for person/company

3. **Payment Confirmation:** Do we need to handle payment confirmation callbacks, or is payment request creation sufficient? _(Currently: activation on request creation)_

4. **Subscription Renewal:** How will annual renewal be handled? _(Now supported - multiple payments per subscriber allowed)_

5. **Refunds:** What happens if a user wants to cancel their subscription? _(Out of scope for this plan)_

6. **TBR advertId field:** The `TBRPostPaymentBodyDto.advertId` is reused for `subscriberId`. Unclear if TBR validates this semantically. _(Left open)_

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
| `subscriber-created.event.ts` | Event | Event emitted when subscription is purchased | ✅ Complete |
| `subscriber-created.listener.ts` | Listener | Handles TBR payment and subscriber activation | ✅ Complete |
| `subscriber-payment.model.ts` | Model | Tracks subscription payment records | ✅ Complete |
| `m-20251203NR4-subscriber-payments.js` | Migration | Creates subscriber_payments table | ✅ Complete |
| `m-20251229-subscriber-payments-alter.js` | Migration | Removes UNIQUE constraint, adds activatedByNationalId | ✅ Complete |

### Files Modified

| File | Changes | Status |
|------|---------|--------|
| `constants.ts` | Added `SUBSCRIBER_CREATED` event and `SUBSCRIBER_PAYMENT` model | ✅ Complete |
| `subscriber.service.ts` | Emit event with actorNationalId (no activation here) | ✅ Complete |
| `subscriber.provider.module.ts` | Register listener and TBR module | ✅ Complete |
| `app.module.ts` | Register `SubscriberPaymentModel` | ✅ Complete |
| `app/skraning/@register/page.tsx` | Show payment info and call mutation | 🔲 Not Started |

---

## Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Research & Configuration | ✅ Complete | TBR integration reviewed, fee codes configured via env vars |
| Phase 2: Backend Implementation | ✅ Complete | Event-based listener, correct activation flow, renewal support |
| Phase 3: Transaction Boundaries | 🔲 Not Started | Add atomicity and error recovery |
| Phase 4: Unit Tests | 🔲 Not Started | Test listener, service, and utilities |
| Phase 5: Frontend Updates | 🔲 Not Started | Registration page needs form connection |

## Environment Variables

The following environment variables must be configured:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LG_SUBSCRIPTION_FEE_CODE` | TBR fee code for subscriptions | `RL401` | No (uses default) |
| `LG_SUBSCRIPTION_AMOUNT` | Annual subscription fee in ISK | `4500` | No (defaults to 4500) |
| `LG_TBR_CHARGE_CATEGORY_PERSON` | TBR charge category for persons | - | Yes (already exists) |
| `LG_TBR_CHARGE_CATEGORY_COMPANY` | TBR charge category for companies | - | Yes (already exists) |
| `LG_TBR_CREDENTIALS` | TBR API credentials | - | Yes (already exists) |
| `LG_TBR_OFFICE_ID` | TBR office ID | - | Yes (already exists) |
| `LG_TBR_PATH` | TBR API base path | - | Yes (already exists) |

## Implementation Details

### Payment Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant SubscriberController
    participant SubscriberService
    participant EventEmitter
    participant SubscriberCreatedListener
    participant TBRService
    participant Database

    User->>Frontend: Click "Subscribe"
    Frontend->>SubscriberController: POST /subscribers/create-subscription
    SubscriberController->>SubscriberService: createSubscriptionForUser(user)
    SubscriberService->>Database: Find subscriber by nationalId
    Database-->>SubscriberService: subscriber (isActive: false)
    SubscriberService->>EventEmitter: emit SUBSCRIBER_CREATED
    Note over EventEmitter: Event includes subscriber + actorNationalId
    EventEmitter-->>SubscriberService: (async)
    SubscriberService-->>SubscriberController: { success: true }
    SubscriberController-->>Frontend: 200 OK
    
    EventEmitter->>SubscriberCreatedListener: handleEvent
    SubscriberCreatedListener->>TBRService: postPayment()
    TBRService-->>SubscriberCreatedListener: success
    SubscriberCreatedListener->>Database: Create payment record
    SubscriberCreatedListener->>Database: Update subscriber (isActive, dates)
    Note over Database: isActive=true, subscribedTo=now+1year
    
    Frontend->>Frontend: session.update()
    Note over Frontend: Refresh session to get isActive=true
```

### Subscription Fields

| Field | Type | Description | Set When |
|-------|------|-------------|----------|
| `isActive` | boolean | Whether subscription is currently active | On successful payment |
| `subscribedFrom` | Date \| null | First day of subscription (preserved on renewal) | On first payment only |
| `subscribedTo` | Date \| null | Subscription expiry date | On every payment (now + 1 year) |

### Payment Record Fields

| Field | Type | Description |
|-------|------|-------------|
| `subscriberId` | UUID | Reference to subscriber |
| `activatedByNationalId` | string | National ID of actor who purchased (supports delegations) |
| `amount` | number | Payment amount in ISK |
| `chargeBase` | string | TBR charge base (subscriber ID) |
| `chargeCategory` | string | TBR category (person vs company) |
| `feeCode` | string | TBR fee code |
| `paidAt` | Date \| null | When payment was confirmed (null = pending) |

---

## Technical Notes

### Actor vs Subscriber

When a user acts on behalf of a company (via Ísland.is delegation):
- `user.nationalId` = company's national ID (the subscriber)
- `user.actor.nationalId` = person's national ID (who is acting)

The `activatedByNationalId` field stores `actor?.nationalId ?? nationalId` to track who actually initiated the purchase.

### Renewal Support

The system now supports subscription renewals:
- Multiple payment records per subscriber (no UNIQUE constraint)
- `subscribedFrom` is preserved (original subscription date)
- `subscribedTo` is updated to now + 1 year on each renewal
- Full payment history is maintained

---

## Testing Checklist

### Phase 3: Transaction Boundaries

- [ ] Listener uses Sequelize transaction for DB operations
- [ ] Payment record and subscriber update are atomic
- [ ] Partial failure handling is tested
- [ ] Error logging captures all payment attempts

### Phase 4: Unit Tests

- [ ] `SubscriberCreatedListener` creates TBR payment correctly
- [ ] `SubscriberCreatedListener` saves payment record with `activatedByNationalId`
- [ ] `SubscriberCreatedListener` sets `subscribedFrom` only if null
- [ ] `SubscriberCreatedListener` always updates `subscribedTo`
- [ ] `SubscriberCreatedListener` handles TBR errors gracefully
- [ ] `SubscriberCreatedListener` rolls back transaction on failure
- [ ] `SubscriberService` does NOT activate subscriber (only emits event)
- [ ] `SubscriberService` correctly determines actor nationalId
- [ ] `isCompanyNationalId` correctly identifies company vs person

### Phase 5: E2E Tests (Frontend)

- [ ] New user registration creates payment and activates subscription
- [ ] Existing subscriber can renew (extends subscribedTo, keeps subscribedFrom)
- [ ] Delegation: actor national ID is correctly tracked
- [ ] Session refresh after subscription shows isActive = true
- [ ] Error states are displayed correctly
