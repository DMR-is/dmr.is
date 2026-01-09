# Review: TBR Subscription Payment Implementation

## Review Date
December 29, 2025

## Last Updated
January 9, 2026

## Status
✅ **IMPLEMENTATION COMPLETE** - All critical fixes implemented and verified.

## Purpose
Critical review of the TBR subscription payment implementation, identifying issues, inconsistencies, and areas requiring clarification.

---

## 🔴 Critical Issues

### 1. **Dual Activation Logic - Conflicting Updates**

The subscriber activation happens in **two places** with conflicting behavior:

**Location 1: `subscriber.service.ts` → `createSubscriptionForUser()`**
```typescript
subscriber.isActive = true
subscriber.subscribedTo = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
if (!subscriber.subscribedFrom) {
  subscriber.subscribedFrom = new Date()
}
await subscriber.save()
// THEN emits event...
```

**Location 2: `subscriber-created.listener.ts` → `createSubscriptionPayment()`**
```typescript
await this.subscriberModel.update(
  { isActive: true, subscribedFrom: new Date() },
  { where: { id: subscriber.id } },
)
```

**Problems:**
- Service sets `isActive: true` **BEFORE** payment is even attempted
- Listener **ALSO** sets `isActive: true` after payment succeeds
- If TBR payment fails, user is already marked as active (paid in service)
- `subscribedTo` is set in service but **NOT** in listener
- `subscribedFrom` might be overwritten by listener (loses the "only set if not already set" logic)

**Question:** Should activation happen:
- A) Before payment (optimistic) → current service behavior
- B) After payment (pessimistic) → current listener behavior
- C) After actual payment confirmation from TBR (not just request creation)?

---

### 2. **Plan Document vs Implementation Mismatch**

The plan document refers to `subscribedAt` but the code uses `subscribedFrom` and `subscribedTo`:

| Plan Document | Actual Implementation |
|---------------|----------------------|
| `subscribedAt` | `subscribedFrom` |
| Single date field | Two date fields (`subscribedFrom`, `subscribedTo`) |

This suggests the plan wasn't updated after the schema changed, or there was a design decision not documented.

**Question:** Is `subscribedAt` being replaced by `subscribedFrom`? What's the semantic difference?

---

### 3. **Event Naming Confusion**

The event is called `SUBSCRIBER_CREATED` but it's emitted when a subscription is being **purchased**, not when a subscriber record is created.

- `getUserByNationalId()` creates the subscriber record (via `findOrCreate`) but doesn't emit the event
- `createSubscriptionForUser()` emits `SUBSCRIBER_CREATED` but doesn't create the subscriber

**Question:** Should this be renamed to `SUBSCRIPTION_PURCHASED` or similar?

---

### 4. **Subscription Amount Inconsistency**

| Location | Amount |
|----------|--------|
| Plan document | 3,000 ISK |
| Listener default | 4,500 ISK |
| Frontend text | 4,500 ISK |

**Question:** Which amount is correct? The plan document says 3,000 ISK but code uses 4,500 ISK.

---

### 5. **SubscriberPaymentModel - One Payment Per Subscriber?**

The `subscriber_payments` table has:
```sql
SUBSCRIBER_ID UUID NOT NULL UNIQUE REFERENCES...
```

The `UNIQUE` constraint means **one payment record per subscriber ever**. This doesn't support:
- Annual renewals
- Multiple payments over time
- Payment history

**Question:** Is this intentional? How will subscription renewal work?

---

## 🟠 Medium Issues

### 6. **Missing Transaction Boundaries**

In the listener, three operations happen sequentially without a transaction:
1. `tbrService.postPayment()` - TBR API call
2. `subscriberPaymentModel.create()` - DB insert
3. `subscriberModel.update()` - DB update

If step 2 or 3 fails after step 1 succeeds, we have:
- Payment created in TBR (user will be charged)
- No local record of the payment
- User not marked as active

**Recommendation:** Wrap DB operations in a transaction, handle TBR call appropriately (idempotency key?).

---

### 7. **TBR DTO Uses `advertId` for Subscriber**

```typescript
await this.tbrService.postPayment({
  advertId: subscriber.id, // Using subscriberId as unique identifier
  ...
})
```

This is confusing and potentially problematic if TBR validates/uses this field expecting an actual advert ID.

**Question:** Does TBR care about this field semantically, or is it just a reference?

---

### 8. **Frontend Form Not Connected**

The registration page (`@register/page.tsx`):
- Has a form with name, nationalId, email fields
- Button has no `onClick` handler
- No mutation call to `createSubscription`
- Form state isn't used for anything

**Status:** Phase 3 (Frontend) is marked "Not Started" in the plan, which is accurate.

---

### 9. **Missing Error Handling in Frontend Flow**

The plan mentions:
> "Display error if TBR payment creation fails"
> "Provide retry mechanism or contact support option"

But there's no implementation or design for this yet.

---

### 10. **Legacy Migration References Still in Plan**

The plan still references:
- `isLegacyMigration` flag in event
- `autoMigrateByKennitala()` method
- Legacy migration flow documentation

But you mentioned legacy migration was discontinued. The event class doesn't have this flag anymore:
```typescript
export class SubscriberCreatedEvent {
  subscriber!: SubscriberDto
  // No isLegacyMigration flag
}
```

**Question:** Should legacy migration references be removed from the plan?

---

## 🟡 Minor Issues / Suggestions

### 11. **Company National ID Detection**

```typescript
private isCompanyNationalId(nationalId: string): boolean {
  const firstDigit = parseInt(nationalId.charAt(0), 10)
  return firstDigit >= 4
}
```

This is a simplistic check. Consider using the `kennitala` package which is already a project dependency for proper validation.

---

### 12. **Hardcoded Strings in Frontend**

```tsx
<Text>
  Við skráninguna verður til greiðsluseðill að fjárhæð 4.500 kr.
  sem er ársáskriftargjald...
</Text>
```

Amount is hardcoded in Icelandic text. Should ideally come from API/config to stay in sync.

---

### 13. **Session Refresh After Payment**

After `createSubscription` mutation succeeds, the session needs to be updated so `isActive` reflects the new state. The auth flow has `trigger === 'update'` handling but:
- Frontend doesn't call `update()` on session after subscription
- User might need to re-login to see active status

---

### 14. **subscribedTo Semantics**

The model has:
```typescript
subscribedTo!: Date | null  // description: 'NULL means subscription is still active'
```

But the service sets:
```typescript
subscriber.subscribedTo = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
```

So `subscribedTo` is the expiry date, not "when subscription ended". If null means active, why set a date for an active subscription?

**Question:** What does `subscribedTo` actually represent?
- A) Expiry date (subscription valid until this date)
- B) Cancellation date (when user cancelled, null = still active)

---

## 🔵 Questions for Clarification (ANSWERED)

1. **Activation timing:** Should user become active before or after successful TBR payment request?
   - ✅ **ANSWER:** After successful TBR call.

2. **Field naming:** Is `subscribedAt` being replaced by `subscribedFrom`? What do `subscribedFrom` and `subscribedTo` mean exactly?
   - ✅ **ANSWER:** Yes, replaced by two fields:
     - `subscribedFrom` = first day of subscription (only set if doesn't exist, preserved on renewal)
     - `subscribedTo` = expiry date (1 year after purchase, always updates on renewal)

3. **Event semantics:** Should `SUBSCRIBER_CREATED` be renamed to reflect it's about payment/subscription purchase?
   - ✅ **ANSWER:** No, keeping existing name. Not worth the refactoring effort.

4. **Subscription amount:** 3,000 ISK or 4,500 ISK?
   - ✅ **ANSWER:** 4,500 ISK default (via env variable)

5. **Payment history:** Should the system support multiple payments per subscriber for renewals?
   - ✅ **ANSWER:** Yes. Also add field to track which nationalId activated the subscription (actor on behalf of company/person via delegations)

6. **Legacy removal:** Should all legacy migration references be removed from the plan?
   - ✅ **ANSWER:** Yes, legacy migration is off the table.

7. **TBR advertId field:** Is reusing this field for subscriberId safe?
   - ⏳ **ANSWER:** Unknown, leaving this question open for now.

---

## Status Summary

| Component | Status | Issues | Action Needed |
|-----------|--------|--------|---------------|
| Database schema | ✅ Complete | - | - |
| Subscriber model | ✅ Complete | - | - |
| Payment model | ✅ Complete | Refactored to `SubscriberTransactionModel` with `activatedByNationalId` | - |
| Subscriber service | ✅ Complete | No longer activates prematurely, uses advisory locks | - |
| Payment listener | ✅ Complete | Correct `subscribedFrom`/`subscribedTo` logic, transaction boundaries | - |
| tRPC router | ✅ Complete | - | - |
| Frontend form | ✅ Complete | `RegistrationButton` calls mutation, refreshes session | - |
| Tests | ✅ Complete | 692 lines of tests in `subscriber-created.listener.spec.ts` | - |
| Plan document | ✅ Complete | Legacy removed, field names fixed | - |

---

## Recommended Actions

### Immediate Code Fixes (Before Merge)

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Fix dual activation: Remove activation from service, keep only in listener | `subscriber.service.ts` | ✅ Done |
| 2 | Fix listener: Only set `subscribedFrom` if null, always update `subscribedTo` | `subscriber-created.listener.ts` | ✅ Done |
| 3 | Remove UNIQUE constraint on `subscriber_id` in payments table | New migration | ✅ Done |
| 4 | Add `activatedByNationalId` field to payments table | New migration + model | ✅ Done |
| 5 | Update plan document: Remove legacy migration references | `plan-tbr-subscription-payment.md` | ✅ Done |
| 6 | Update plan document: Fix `subscribedAt` → `subscribedFrom`/`subscribedTo` | `plan-tbr-subscription-payment.md` | ✅ Done |
| 7 | Update plan document: Fix subscription amount to 4500 ISK | `plan-tbr-subscription-payment.md` | ✅ Done |

### Before Production

| # | Task | Status |
|---|------|--------|
| 8 | Implement frontend form with mutation call | ✅ Done - `RegistrationButton.tsx` |
| 9 | Add session refresh after subscription purchase | ✅ Done - calls `await update()` |
| 10 | Add transaction boundaries in listener | ✅ Done - uses `sequelize.transaction()` |

### Technical Debt

| # | Task | Status |
|---|------|--------|
| 11 | ~~Consider renaming event to `SUBSCRIPTION_PURCHASED`~~ | ❌ Won't Do |
| 12 | Use kennitala package for national ID validation | ✅ Done - uses `Kennitala.isCompany()` |
| 13 | Add comprehensive tests | ✅ Done - 692 lines in listener spec |
| 14 | Document TBR integration (fee codes, categories) | 🔲 Future |

---

## Implementation Details for Code Fixes

### Fix 1: Remove activation from service

**Current (wrong):**
```typescript
// subscriber.service.ts
subscriber.isActive = true
subscriber.subscribedTo = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
if (!subscriber.subscribedFrom) {
  subscriber.subscribedFrom = new Date()
}
await subscriber.save()
```

**Should be:**
```typescript
// subscriber.service.ts
// Don't activate here - let the listener do it after successful payment
// Just emit the event
this.eventEmitter.emit(LegalGazetteEvents.SUBSCRIBER_CREATED, {
  subscriber: subscriber.fromModel(),
} as SubscriberCreatedEvent)
```

### Fix 2: Correct listener activation logic

**Current (partial):**
```typescript
await this.subscriberModel.update(
  { isActive: true, subscribedFrom: new Date() },
  { where: { id: subscriber.id } },
)
```

**Should be:**
```typescript
// Only set subscribedFrom if it doesn't exist
const existingSubscriber = await this.subscriberModel.findByPk(subscriber.id)
const subscribedTo = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
const updateData: Partial<SubscriberAttributes> = {
  isActive: true,
  subscribedTo,
}
if (!existingSubscriber?.subscribedFrom) {
  updateData.subscribedFrom = new Date()
}
await this.subscriberModel.update(updateData, { where: { id: subscriber.id } })
```

### Fix 3 & 4: Migration for payments table

```sql
-- Remove UNIQUE constraint
ALTER TABLE subscriber_payments DROP CONSTRAINT IF EXISTS subscriber_payments_subscriber_id_key;

-- Add activated_by_national_id column
ALTER TABLE subscriber_payments ADD COLUMN activated_by_national_id TEXT NOT NULL;
```

---

## Next Steps

1. ✅ Questions answered by Thorri
2. ✅ Review document updated with answers
3. ✅ Code fixes #1-7 implemented
4. ✅ Main plan document updated
5. ✅ Migration applied
6. ✅ Frontend form implemented (`RegistrationButton.tsx`)
7. ✅ Tests added (692 lines)

---

## Completion Notes (January 9, 2026)

All implementation tasks have been completed:

- **Service layer**: Uses advisory locks for idempotency, emits event without premature activation
- **Listener**: Creates PENDING transaction, calls TBR, updates to CREATED on success, activates subscriber with correct `subscribedFrom`/`subscribedTo` logic
- **Model**: Refactored from `SubscriberPaymentModel` to `SubscriberTransactionModel` (junction table)
- **Frontend**: `RegistrationButton` component with mutation call, session refresh, and error toast
- **Tests**: Comprehensive test coverage in `subscriber-created.listener.spec.ts`

The event remains named `SUBSCRIBER_CREATED` - renaming was deemed not worth the effort.

