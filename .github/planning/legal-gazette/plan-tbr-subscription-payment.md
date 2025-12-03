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

- **Fee Amount:** 3,000 ISK annual subscription fee
- **Trigger:** When new subscriber completes registration (not legacy migration)
- **Activation:** Set `isActive: true` upon payment request creation (not payment confirmation)
- **Fee Code:** Different from advert payment fee code (TBD)

---

## Implementation Plan

### Phase 1: Research & Configuration

#### 1.1 Determine TBR Fee Codes

- [ ] Identify correct fee code for subscription payments
- [ ] Identify charge category for subscription payments
- [ ] Confirm payment amount (3,000 ISK)

#### 1.2 Review Existing TBR Integration

- [ ] Understand `TBRService` interface and methods
- [ ] Review advert payment flow for reference
- [ ] Identify any differences needed for subscription payments

---

### Phase 2: Backend Implementation

#### 2.1 Create Subscription Payment Service

**Option A:** Add method to existing `TBRService`
```typescript
async createSubscriptionPayment(subscriber: SubscriberDto): Promise<void>
```

**Option B:** Create dedicated `SubscriptionPaymentService`

#### 2.2 Integration Points

Two possible approaches:

**Approach 1: Event-based (Listener)**
- Create `SubscriberCreatedEvent`
- Create `SubscriberCreatedListener` that triggers TBR payment
- Similar to `AdvertPublishedListener`

**Approach 2: Direct call in service**
- Call payment service directly in `SubscriberService.createSubscriber()`
- Simpler but less decoupled

#### 2.3 Subscriber Activation

After TBR payment request is created:
```typescript
await this.subscriberModel.update(
  { isActive: true },
  { where: { id: subscriber.id } }
)
```

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

- [ ] Unit tests for subscription payment service
- [ ] Integration test with TBR (dev environment)
- [ ] E2E test of new user registration flow
- [ ] Verify `isActive` is set correctly after payment creation

---

## Open Questions

1. **Fee Code:** What is the correct TBR fee code for subscription payments?

2. **Charge Category:** What charge category should be used?

3. **Payment Confirmation:** Do we need to handle payment confirmation callbacks, or is payment request creation sufficient?

4. **Subscription Renewal:** How will annual renewal be handled? (Out of scope for this plan?)

5. **Refunds:** What happens if a user wants to cancel their subscription?

---

## Dependencies

- TBR service must be configured and accessible
- Fee codes must be set up in TBR system
- AWS credentials for any notification emails

---

## File Summary

### New Files to Create

| File | Type | Description | Status |
|------|------|-------------|--------|
| TBD | Service/Listener | Subscription payment logic | 🔲 Not Started |

### Files to Modify

| File | Changes | Status |
|------|---------|--------|
| `subscriber.service.ts` | Trigger payment on new subscriber creation | 🔲 Not Started |
| `app/skraning/@register/page.tsx` | Show payment info and success state | 🔲 Not Started |

---

## Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Research & Configuration | 🔲 Not Started | Need TBR fee codes |
| Phase 2: Backend Implementation | 🔲 Not Started | |
| Phase 3: Frontend Updates | 🔲 Not Started | |
| Phase 4: Testing | 🔲 Not Started | |

---

## Related Plans

- [Legacy Subscriber Migration](./plan-legacy-subscriber-migration.md) - Migration flow (complete, no payment needed for migrated users)
