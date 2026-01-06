# Plan: TBR Transaction Table Consolidation

> **Created:** January 6, 2026  
> **Status:** ✅ Implementation Complete (Migration Ready)  
> **Approach:** Database-first migration

---

## Overview

Consolidate `subscriber_payment` table into `tbr_transaction` table, creating a unified payment tracking system. The relationship will be inverted - instead of transactions belonging to adverts/subscribers, adverts and subscribers will reference transactions.

---

## Current Schema

### `tbr_transaction` table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| advert_id | UUID | FK to advert (NOT NULL, UNIQUE) |
| fee_code_id | UUID | FK to fee_code |
| fee_code_multiplier | NUMBER | |
| total_price | NUMBER | |
| charge_base | TEXT | |
| charge_category | TEXT | |
| paid_at | TIMESTAMP | nullable |
| status | TEXT | PENDING/CREATED/FAILED/PAID |
| tbr_reference | TEXT | nullable |
| tbr_error | TEXT | nullable |

### `subscriber_payment` table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| subscriber_id | UUID | FK to subscriber |
| activated_by_national_id | TEXT | |
| amount | NUMBER | |
| charge_base | TEXT | |
| charge_category | TEXT | |
| fee_code | TEXT | string, not FK |
| paid_at | TIMESTAMP | nullable |
| status | TEXT | PENDING/CREATED/FAILED/PAID |
| tbr_reference | TEXT | nullable |
| tbr_error | TEXT | nullable |

---

## Proposed Schema

### `tbr_transaction` table (unified)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| transaction_type | TEXT | 'ADVERT' or 'SUBSCRIPTION' (NOT NULL) |
| fee_code_id | UUID | FK to fee_code (NOT NULL) |
| fee_code_multiplier | NUMBER | default 1 |
| total_price | NUMBER | keep original naming |
| charge_base | TEXT | |
| charge_category | TEXT | |
| debtor_national_id | TEXT | National ID of person/company being charged |
| paid_at | TIMESTAMP | nullable |
| status | TEXT | PENDING/CREATED/FAILED/PAID |
| tbr_reference | TEXT | nullable |
| tbr_error | TEXT | nullable |

### `subscriber_transaction` table (NEW - junction table)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| subscriber_id | UUID | FK to subscriber (NOT NULL) |
| transaction_id | UUID | FK to tbr_transaction (NOT NULL) |
| activated_by_national_id | TEXT | Who triggered this transaction |
| is_current | BOOLEAN | Flag for the current/latest transaction |
| created_at | TIMESTAMP | BaseModel |
| updated_at | TIMESTAMP | BaseModel |

### `advert` table (add column)
| Column | Type | Notes |
|--------|------|-------|
| transaction_id | UUID | FK to tbr_transaction (nullable) |

### `subscriber` table (no changes needed)
Transactions accessed via `subscriber_transaction` junction table.

---

## Migration Strategy

### Phase 1: Prepare tbr_transaction table
1. Remove UNIQUE constraint from advert_id
2. Make advert_id nullable  
3. Add new columns: transaction_type, debtor_national_id
4. Make fee_code_id nullable temporarily (for migration)
5. Set transaction_type = 'ADVERT' for existing rows
6. Backfill debtor_national_id from advert.createdByNationalId

### Phase 2: Create subscriber_transaction junction table
1. Create subscriber_transaction table with subscriber_id, transaction_id, activated_by_national_id, is_current

### Phase 3: Add transaction_id to advert table
1. Add transaction_id (nullable UUID FK) to advert table
2. Backfill from existing tbr_transaction.advert_id

### Phase 4: Create fee_code record for subscriptions
1. Insert subscription fee code into fee_code table if not exists
2. Get the fee_code_id for use in migration

### Phase 5: Migrate subscriber_payment data
1. Copy subscriber_payment records to tbr_transaction with transaction_type = 'SUBSCRIPTION'
2. Create subscriber_transaction records linking subscribers to their new transactions
3. Set is_current = true for the latest transaction per subscriber

### Phase 6: Cleanup
1. Drop advert_id column from tbr_transaction
2. Make fee_code_id NOT NULL
3. Drop subscriber_payment table
4. Remove SubscriberPaymentModel

---

## Files to Modify

### Models
- [x] `tbr-transactions.model.ts` - Add transaction_type, debtor_national_id; remove advert_id
- [x] `subscriber-transaction.model.ts` - NEW: junction table model
- [x] `advert.model.ts` - Add transactionId FK and relation
- [x] `subscriber.model.ts` - Add HasMany relation to subscriber_transaction
- [x] Delete `subscriber-payment.model.ts`

### Listeners
- [x] `subscriber-created.listener.ts` - Use TBRTransactionModel + SubscriberTransactionModel
- [x] `advert-published.listener.ts` - Update advert.transactionId after creating transaction

### Services
- [x] `advert-payment.task.ts` - Updated to use debtorNationalId directly
- [x] Any service using SubscriberPaymentModel - Updated

### Modules
- [x] `app.module.ts` - Replaced SubscriberPaymentModel with SubscriberTransactionModel
- [x] `subscriber.provider.module.ts` - Registered new models
- [x] `publication.listener.module.ts` - Added AdvertModel

### Tests
- [x] Update subscriber-created.listener.spec.ts (29 tests passing)
- [x] Update advert-published.listener.spec.ts (added AdvertModel mock)

---

## Benefits of Junction Table

1. **History**: Can query all transactions for a subscriber (renewals, failed attempts)
2. **Current Transaction**: `is_current = true` flag gives quick access to latest
3. **Audit Trail**: `activated_by_national_id` tracks who triggered each transaction
4. **Clean Separation**: Transaction table stays generic, subscriber-specific data in junction

---

## Risks

1. **Data Migration Complexity**: Need careful SQL to migrate subscriber_payment → tbr_transaction + subscriber_transaction
2. **Fee Code**: Need to ensure subscription fee code exists in fee_code table
3. **Breaking Changes**: Services expecting SubscriberPaymentModel will fail
4. **Query Changes**: Any code joining via advert_id needs updating

---

## Status

| Phase | Status | Notes |
|-------|--------|-------|
| Planning | ✅ Complete | |
| Phase 1: Prepare tbr_transaction | ✅ Complete | Migration file created |
| Phase 2: Create subscriber_transaction | ✅ Complete | Migration file created |
| Phase 3: Add advert.transaction_id | ✅ Complete | Migration file created |
| Phase 4: Create subscription fee_code | ✅ Complete | Migration file created |
| Phase 5: Migrate subscriber_payment | ✅ Complete | Migration file created |
| Phase 6: Cleanup | ✅ Complete | Migration file created |
| Update Models | ✅ Complete | All models updated |
| Update Listeners | ✅ Complete | Both listeners updated |
| Update Tests | ✅ Complete | 154 tests passing |

---

## Implementation Notes

**Migration File:** `apps/legal-gazette-api/db/migrations/m-20260106-tbr-transaction-consolidation.js`

**Key Changes:**
1. `TBRTransactionModel` - Added `transactionType` (ADVERT/SUBSCRIPTION), `debtorNationalId`; removed `advertId`
2. `SubscriberTransactionModel` - NEW junction table for subscriber → transaction history with `isCurrent` flag
3. `AdvertModel` - Added `transactionId` FK (1:1 relationship via BelongsTo)
4. `SubscriberModel` - Added HasMany relation to SubscriberTransactionModel
5. Deleted `SubscriberPaymentModel`

**Test Results:** All 154 tests passing after consolidation
