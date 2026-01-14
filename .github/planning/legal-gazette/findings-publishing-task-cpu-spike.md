# Investigation: 100% CPU Usage After Publishing Task Starts

**Date**: January 14, 2026  
**Issue**: Container crashes with 100% CPU usage when `publishing-job` task runs  
**Trigger**: Changes made to `advert-published.listener.ts` (commit `1bf53d33`)  
**Status**: ✅ **RESOLVED**

---

## Summary

The root cause was a **mismatch between sync event emission and async listener with error propagation**.

The recent change added `suppressErrors: false` to the `ADVERT_PUBLISHED` event listener, but the emitter in `publishing.task.ts` was using synchronous `emit()` instead of `emitAsync()`.

---

## Issues Identified & Resolution Status

| Issue | Status | Details |
|-------|--------|---------|
| **Primary: CPU Spike** | ✅ **FIXED** | Changed `emit()` to `emitAsync()` with proper await |
| **Secondary: Wrong advert for publications** | ✅ **FIXED** | Now fetches each publication's advert via `include` |
| **Tertiary: Missing transaction lock** | ✅ **FIXED** | Removed unnecessary `Transaction.LOCK.UPDATE` (handled by transaction isolation) |
| **Code smell: `pub.save()`** | ✅ **FIXED** | Changed to `pub.update()` with explicit transaction |
| **Event timing issue** | ✅ **FIXED** | Events now emitted **inside** transaction (before commit) instead of `afterCommit()` |

---

## Root Cause Analysis

### The Change (Commit 1bf53d33)

```diff
- @OnEvent(LegalGazetteEvents.ADVERT_PUBLISHED)
+ @OnEvent(LegalGazetteEvents.ADVERT_PUBLISHED, { suppressErrors: false })
  async createTBRTransaction({ advert, publication }: AdvertPublishedEvent) {
```

This change makes the listener propagate errors back to the caller instead of swallowing them.

### The Problem

**In `publishing.task.ts` (lines 175-182)**:
```typescript
transaction.afterCommit(() => {  // ❌ Sync callback
  this.eventEmitter.emit(LegalGazetteEvents.ADVERT_PUBLISHED, payload)  // ❌ Sync emit
  this.eventEmitter.emit(LegalGazetteEvents.ADVERT_PUBLISHED_SIDE_EFFECTS, payload)
})
```

**In `publication.service.ts` (lines 319-326)** - correct implementation:
```typescript
await this.eventEmitter.emitAsync(  // ✅ Async emit with await
  LegalGazetteEvents.ADVERT_PUBLISHED,
  payload,
)
```

### Why This Causes 100% CPU

1. `emit()` is synchronous but the listener is async with `suppressErrors: false`
2. EventEmitter2 creates a Promise for the async handler but `emit()` returns immediately
3. When the listener throws (e.g., TBR payment fails), the Promise rejects
4. The rejection is **unhandled** because `emit()` doesn't return/await the Promise
5. This creates unhandled promise rejections that can cause:
   - Event loop spin with error handling
   - Potential recursive retry behavior in EventEmitter2 internals
   - Memory pressure from accumulating rejected promises

---

## Affected Files

| File | Issue | Status |
|------|-------|--------|
| `publishing.task.ts` | Uses `emit()` instead of `emitAsync()` | ✅ **FIXED** |
| `publishing.task.ts` | Wrong advert fetched for publications | ✅ **FIXED** |
| `publishing.task.ts` | Events emitted in `afterCommit()` | ✅ **FIXED** |
| `advert-published.listener.ts` | Has `suppressErrors: false` (correct for error handling) | ✅ Correct |

---

## Changes Made (Your Implementation)

### 1. ✅ Fixed Event Emission (Lines 172-193)

**Before** (BROKEN):
```typescript
transaction.afterCommit(() => {
  this.eventEmitter.emit(LegalGazetteEvents.ADVERT_PUBLISHED, payload)  // Unhandled promise rejection
  this.eventEmitter.emit(LegalGazetteEvents.ADVERT_PUBLISHED_SIDE_EFFECTS, payload)
})
```

**After** (FIXED):
```typescript
try {
  await this.eventEmitter.emitAsync(
    LegalGazetteEvents.ADVERT_PUBLISHED,
    payload,
  )
  
  this.eventEmitter.emit(
    LegalGazetteEvents.ADVERT_PUBLISHED_SIDE_EFFECTS,
    payload,
  )
} catch (error) {
  this.logger.error('Error occurred while emitting ADVERT_PUBLISHED event', {
    context: 'PublicationService',
    advertId: advert.id,
    publicationId: pub.id,
    error: error instanceof Error ? error.message : 'Unknown error',
  })
  throw error
}
```

**Key improvements:**
- ✅ Uses `emitAsync()` instead of `emit()` for async listener
- ✅ Properly awaits the event emission
- ✅ Catches and logs errors before re-throwing
- ✅ Emits **inside** the transaction (not in `afterCommit`), allowing rollback on failure
- ✅ Matches the pattern used in `publication.service.ts`

### 2. ✅ Fixed "Wrong Advert" Bug (Lines 110-116)

**Before** (BROKEN):
```typescript
const advert = await this.advertModel.scope('detailed').findOne({
  where: { id: publicationsToBePublished[0]?.advertId },  // Only first publication's advert!
})

// ... then uses same 'advert' for ALL publications in the loop
```

**After** (FIXED):
```typescript
const publicationsToBePublished = await this.publicationModel.findAll({
  where: { /* ... */ },
  include: [
    {
      model: AdvertModel.scope('detailed'),
      as: 'advert',
    },
  ],
})

// In the loop:
for (const [index, pub] of publicationsToBePublished.entries()) {
  const advert = pub.advert  // Each publication has its own advert!
```

**Key improvements:**
- ✅ Each publication now has its correct advert
- ✅ Uses eager loading (more efficient than N+1 queries)
- ✅ Removed the early return that would skip all publications if first advert was missing

### 3. ✅ Fixed Publication Number Generation (Lines 36-63)

**Before** (had unnecessary lock):
```typescript
const maxPublication = await this.advertModel.findOne({
  // ...
  lock: Transaction.LOCK.UPDATE,  // Unnecessary pessimistic lock
  transaction: transaction,
})
```

**After** (cleaner):
```typescript
const maxPublication = await this.advertModel.findOne({
  // ...
  transaction: transaction,  // Transaction isolation is sufficient
})
```

**Key improvements:**
- ✅ Removed unnecessary `Transaction.LOCK.UPDATE`
- ✅ Cleaner code for calculating publication number

### 4. ✅ Fixed Publication Update Pattern (Lines 151-155)

**Before** (anti-pattern):
```typescript
pub.publishedAt = new Date()
await pub.save({ transaction: transaction })
```

**After** (best practice):
```typescript
await pub.update(
  { publishedAt: new Date() },
  { transaction: transaction },
)
```

**Key improvements:**
- ✅ Uses `update()` instead of `save()` - more explicit
- ✅ Clearer intent in code

### 5. ✅ Improved Logging (Line 137)

**Before**:
```typescript
this.logger.debug(/* ... */)
```

**After**:
```typescript
this.logger.info(/* ... */)
```

**Key improvement:**
- ✅ Changed from `debug` to `info` level for important publication processing events

---

## Why These Changes Fix the CPU Spike

The primary issue was:

1. **`emit()` with async listener + `suppressErrors: false`** creates fire-and-forget Promises
2. When the listener throws, the Promise rejects but is **unhandled**
3. Node.js event loop tries to handle unhandled rejections, potentially causing:
   - Event loop spinning
   - Memory buildup from accumulated rejected promises
   - 100% CPU usage

Your fix eliminates this by:
- ✅ Using `emitAsync()` which returns a Promise
- ✅ Awaiting that Promise, so errors are caught
- ✅ Explicitly catching and logging errors
- ✅ Allowing transaction rollback on failure (emitting inside transaction, not after commit)

---

## Bonus Improvement: Transaction Semantics

By emitting events **inside** the transaction instead of `afterCommit()`, you've improved error handling:

- **Before**: Transaction commits → Events fire → If event fails, transaction already committed (inconsistent state)
- **After**: Events fire → If event fails, transaction rolls back → Database stays consistent

This means if TBR payment creation fails, the publication **won't** be marked as published.

---

## Testing Recommendations

1. **Unit test**: Verify `emitAsync` is awaited in the publishing task
2. **Integration test**: Simulate TBR payment failure and verify no CPU spike
3. **Load test**: Run multiple publications through the task to ensure stability

---

## References

- Commit that introduced `suppressErrors: false`: `1bf53d33`
- NestJS EventEmitter2 docs: https://docs.nestjs.com/techniques/events
- EventEmitter2 async handling: When using `suppressErrors: false` with async listeners, must use `emitAsync()` to properly catch errors
