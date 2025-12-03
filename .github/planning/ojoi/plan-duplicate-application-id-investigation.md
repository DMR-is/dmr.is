# Investigation: Duplicate Application IDs in Official Journal

## Issue Summary
A user in the Official Journal system created 2 different cases with the same application ID. The first request **timed out** but the case was actually created, then when the user retried, a second case was created.

## Investigation Date
December 1, 2025

---

## Root Cause Analysis

### Primary Issue: **Timeout During Case Creation + No Idempotency Protection**

#### What Actually Happened:

1. **First Request**: User submitted application via `POST :id/post`
2. **Case Created**: The `createCaseByApplication` method successfully created the case in the database
3. **Timeout**: The HTTP response timed out before reaching the client (long-running operation, network issue, etc.)
4. **User Sees Error**: Frontend shows timeout/error, user thinks submission failed
5. **User Retries**: User clicks submit again
6. **Second Request**: `caseLookupByApplicationId` finds the existing case... BUT the code **updates** it and returns success, OR there's another issue

**Wait** - if the case exists, `postApplication` should UPDATE not CREATE. Let me revise:

#### More Likely Scenario:

1. **First Request**: Started case creation, timed out MID-TRANSACTION
2. **Transaction State Unknown**: Either:
   - Transaction committed (case created) but response timed out
   - Transaction was still in progress when timeout occurred
3. **Second Request**: 
   - If first transaction was still running: `findOne` might not see uncommitted row
   - If first transaction committed: Should have found and updated... unless check also timed out

#### The Actual Problem - No Unique Constraint:

The `case_case` table does NOT have a `UNIQUE` constraint on `application_id`:
```sql
CREATE TABLE IF NOT EXISTS CASE_CASE (
  ID UUID NOT NULL DEFAULT UUID_GENERATE_V4 (),
  ADVERT_ID UUID,
  APPLICATION_ID UUID,  -- ⚠️ NO UNIQUE CONSTRAINT
  ...
)
```

This means the database allows multiple cases with the same `application_id`, regardless of what happened with timeouts.

#### Missing `@Transactional()` Decorator:
The `createCaseByApplication` method in `case-create.service.ts` does NOT have a `@Transactional()` decorator:
```typescript
@LogAndHandle()  // No @Transactional()!
async createCaseByApplication(body: PostApplicationBody): Promise<ResultWrapper<{ id: string }>> {
```

This is problematic because if the method times out partway through:
- The case might be created
- But subsequent operations (categories, channels, signatures, attachments) might fail
- There's no rollback of the partial state

---

## The Flow That Caused Duplicates

```
Request 1 (Timed Out):
┌─────────────────────────────────────────────────────────────┐
│ POST /applications/:id/post                                 │
│   ↓                                                         │
│ caseLookupByApplicationId() → 404 (not found)               │
│   ↓                                                         │
│ createCaseByApplication()                                   │
│   ↓                                                         │
│ caseModel.create() → SUCCESS (case created in DB)           │
│   ↓                                                         │
│ createSignature(), createCategories()... (still running)    │
│   ↓                                                         │
│ ⏱️ HTTP TIMEOUT - Response never sent to client             │
│   ↓                                                         │
│ Transaction eventually commits (case exists in DB)          │
└─────────────────────────────────────────────────────────────┘

Request 2 (User Retry):
┌─────────────────────────────────────────────────────────────┐
│ POST /applications/:id/post                                 │
│   ↓                                                         │
│ caseLookupByApplicationId() → FOUND existing case           │
│   ↓                                                         │
│ updateCase() - Updates the existing case                    │
│   ↓                                                         │
│ ✅ Returns success                                          │
└─────────────────────────────────────────────────────────────┘
```

**But wait** - if flow 2 found and updated, how are there duplicates?

#### Alternative Scenario - Both Requests Created Cases:

```
Request 1:                          Request 2 (retry before R1 commits):
┌────────────────────────┐          ┌────────────────────────┐
│ caseLookup → 404       │          │ caseLookup → 404       │
│ (no case yet)          │          │ (R1 not committed yet) │
│   ↓                    │          │   ↓                    │
│ createCase() starts    │          │ createCase() starts    │
│   ↓                    │          │   ↓                    │
│ INSERT case_case       │          │ INSERT case_case       │
│ (in transaction)       │          │ (in transaction)       │
│   ↓                    │          │   ↓                    │
│ ...other operations... │          │ ...other operations... │
│   ↓                    │          │   ↓                    │
│ COMMIT                 │          │ COMMIT                 │
│ (timeout to client)    │          │ (success to client)    │
└────────────────────────┘          └────────────────────────┘

Result: TWO cases with same application_id
```

This is possible because:
1. **`createCaseByApplication` is called WITHOUT the transaction** from `postApplication`'s catch block
2. `createCaseByApplication` doesn't have `@Transactional()` AND doesn't accept a transaction parameter
3. No `UNIQUE` constraint on `application_id` to prevent the second insert
4. `findOne` without `FOR UPDATE` lock doesn't prevent concurrent reads

### The Transaction Bug (Key Finding!)

In `application.service.ts`, `postApplication` has `@Transactional()`:
```typescript
@Transactional()
async postApplication(applicationId: string, transaction?: Transaction) {
  try {
    const caseLookup = await this.utilityService.caseLookupByApplicationId(
      applicationId,
      transaction,  // ✅ Transaction passed here
    )
    // ... update flow uses transaction
  } catch (error) {
    if (error instanceof HttpException && error.getStatus() === 404) {
      // ⚠️ BUG: Transaction NOT passed here!
      return await this.caseService.createCaseByApplication({
        applicationId,
      })
    }
  }
}
```

And `createCaseByApplication` doesn't even accept a transaction:
```typescript
@LogAndHandle()
// No @Transactional()!
async createCaseByApplication(
  body: PostApplicationBody,  // No transaction parameter!
): Promise<ResultWrapper<{ id: string }>>
```

**Result**: All operations in `createCaseByApplication` run with **auto-commit** (each INSERT commits immediately), with no isolation from concurrent requests.

---

## Affected Files

| File | Location | Issue |
|------|----------|-------|
| `application.service.ts` | `libs/shared/modules/src/application/` | No idempotency in `postApplication`, transaction not passed to `createCaseByApplication` |
| `case-create.service.ts` | `libs/shared/modules/src/case/services/create/` | Missing `@Transactional()` on `createCaseByApplication` - long-running, can timeout |
| `utility.service.ts` | `libs/shared/modules/src/utility/` | No row-level locking in `caseLookupByApplicationId` |
| `initial-migrations-official-journal.js` | `apps/official-journal-api/migrations/` | No UNIQUE constraint on `application_id` |
| `application.controller.ts` | `apps/official-journal-application-api/` | No idempotency key support on `POST :id/post` |

---

## Recommended Fixes

### Fix 1: Add Database Unique Constraint (Highest Priority) ⭐
Create a new migration to add a unique index:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_case_case_application_id_unique 
ON case_case (application_id) 
WHERE application_id IS NOT NULL;
```

This will prevent duplicates at the database level, regardless of timeout/retry scenarios.

### Fix 2: Add `@Transactional()` to `createCaseByApplication`
```typescript
@LogAndHandle()
@Transactional()  // Add this - ensures atomic operation
async createCaseByApplication(body: PostApplicationBody): Promise<ResultWrapper<{ id: string }>> {
```

This ensures if any part fails or times out, the entire operation rolls back.

### Fix 3: Handle Unique Constraint Violation Gracefully
After adding the unique constraint, update `createCaseByApplication` to catch unique violation errors:
```typescript
try {
  const createCaseResult = await this.create(values.caseBody)
  // ...
} catch (error) {
  if (error.name === 'SequelizeUniqueConstraintError') {
    // Case already exists - return existing case ID
    const existing = await this.utilityService.caseLookupByApplicationId(body.applicationId)
    return ResultWrapper.ok({ id: existing.result.value.id })
  }
  throw error
}
```

### Fix 4: Use "Upsert" Pattern or Row-Level Locking
Modify `caseLookupByApplicationId` to use pessimistic locking when called within a transaction:
```typescript
const found = await this.caseModel.findOne({
  where: { applicationId: applicationId },
  lock: transaction ? Transaction.LOCK.UPDATE : undefined,
  transaction,
})
```

### Fix 5: Add Idempotency Key to API Endpoint
Add idempotency key support to prevent retry issues:
```typescript
@Post(':id/post')
@ApiHeader({ name: 'X-Idempotency-Key', required: false })
async postApplication(
  @Param('id') applicationId: string,
  @Headers('X-Idempotency-Key') idempotencyKey?: string,
) {
  // Check Redis/cache for idempotency key
  // If found, return cached response
  // If not, process and cache result
}
```

### Fix 6: Optimize `createCaseByApplication` Performance
The method does many sequential operations that could timeout:
- Fetch application from X-Road
- Create case
- Create signature
- Create submit comment
- Create categories (parallel)
- Create channels (parallel)
- Get attachments
- Create case attachments (parallel)
- Create additions (parallel)

Consider:
1. Moving non-critical operations to background jobs
2. Increasing API timeout for this endpoint
3. Adding progress tracking for long operations

---

## Immediate Mitigation

Until fixes are deployed, the duplicate cases need to be manually identified and merged/deleted:
```sql
-- Find duplicates
SELECT application_id, COUNT(*) as count 
FROM case_case 
WHERE application_id IS NOT NULL 
GROUP BY application_id 
HAVING COUNT(*) > 1;

-- Review duplicates before any action
SELECT * FROM case_case 
WHERE application_id IN (
  SELECT application_id 
  FROM case_case 
  WHERE application_id IS NOT NULL 
  GROUP BY application_id 
  HAVING COUNT(*) > 1
)
ORDER BY application_id, created_at;
```

---

## Priority Order for Fixes

1. 🔴 **Critical**: Add unique constraint on `application_id` (Fix 1) - Prevents future duplicates at DB level
2. 🔴 **Critical**: Handle unique constraint violation gracefully (Fix 3) - Return existing case on conflict
3. 🟠 **High**: Add `@Transactional()` to `createCaseByApplication` (Fix 2) - Ensures atomic operations
4. 🟡 **Medium**: Row-level locking in lookup (Fix 4) - Extra safety layer
5. 🟡 **Medium**: Optimize performance to reduce timeout risk (Fix 6)
6. 🟢 **Low**: Idempotency keys (Fix 5) - API best practices for retries

---

## Why Timeout Happened

The `createCaseByApplication` method is **very slow** because it:

1. **Fetches from X-Road** (external API call - can be slow)
2. Creates case record
3. Creates signature with multiple records
4. Creates submit comment
5. Creates categories (one by one, then parallel)
6. Creates channels (parallel)
7. Fetches attachments
8. Creates case attachments (parallel)
9. Creates additions (parallel)

All this happens **synchronously** before returning a response. If any step is slow or the total exceeds the HTTP timeout (typically 30-60 seconds), the client sees a timeout even though the work may complete.

---

## Data Recovery

The affected duplicate cases should be reviewed to determine:
1. Which case has more complete data
2. Whether any actions (comments, status changes, attachments) were performed on either
3. Whether the user was charged for both applications

A data cleanup script may be needed after determining which record to keep.

---

## Testing Recommendations

After implementing fixes:
1. Write integration tests that simulate concurrent `postApplication` calls
2. Verify unique constraint prevents duplicates
3. Test that the UI properly prevents double-clicks
4. Verify error handling when unique constraint is violated

---

## Status

- [x] Investigation complete
- [ ] Fix 1: Database migration created
- [ ] Fix 2: Row-level locking implemented
- [ ] Fix 3: `@Transactional()` added
- [ ] Fix 4: Error handling updated
- [ ] Fix 5: Idempotency key added
- [ ] Fix 6: Frontend protection added
- [ ] Data cleanup completed
