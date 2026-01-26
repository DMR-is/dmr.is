# Fix: Recall Application Validation Errors Only Showing After Server 400

## Problem Summary

Users creating recall applications (innköllun) don't see validation errors until after the server returns a 400 error. The server logs show:

- "staðsetning kröfulýsingar eða tölvupóstur er nauðsynleg"
- "Nafn skiptastjóra er nauðsynlegt"

The UI shows the generic error: "Ekki tókst að senda inn auglýsingu"

## Investigation Result ✅

**Confirmed:** Step validation works correctly - errors appear when clicking "Halda áfram" with empty required fields.

**Additional finding:** Fields like `liquidatorName` are sometimes **missing entirely** from the data object, not just empty.

## Root Cause Analysis

### The Bug: Shallow Spread in Optimistic Update

**File:** `apps/legal-gazette-application-web/src/hooks/useUpdateApplication.ts:74-77`

```typescript
const optimisticData: ApplicationDetailedDto = {
  ...prevData,
  answers: {
    ...prevData?.answers,
    ...answers,  // ← SHALLOW SPREAD - replaces nested objects entirely!
  },
}
```

### How It Corrupts Data

When updating any field in `settlementFields`:

**Before update:**

```javascript
prevData.answers = {
  fields: {
    settlementFields: {
      name: 'Company ABC',
      nationalId: '1234567890',
      liquidatorName: 'John Doe',  // ← EXISTS
      address: '123 Main St'
    }
  },
  signature: {...}
}
```

**Incoming update (partial):**

```javascript
answers = {
  fields: {
    settlementFields: {
      name: 'New Company Name'  // Only updating name
    }
  }
}
```

**After shallow spread:**

```javascript
optimisticData.answers = {
  fields: {                       // ← ENTIRE fields object REPLACED
    settlementFields: {
      name: 'New Company Name'    // Only this field exists now!
    }
  },
  signature: {...}               // signature preserved (top-level)
}
// liquidatorName, nationalId, address are GONE from cache!
```

### Why Server Has Correct Data But Client Doesn't

- **Server:** Uses `deepmerge` library → correctly merges nested objects
- **Client:** Uses shallow spread `{...prev, ...new}` → replaces nested objects

### The Cascade Effect

1. User fills in `liquidatorName` → saved to DB ✓, cache correct ✓
2. User updates `name` field in same `settlementFields` object
3. Optimistic update **replaces** `fields` → `liquidatorName` lost from cache
4. React Query cache now has incomplete data
5. Any operation reading from cache gets corrupted data
6. Submit validation may pass/fail unpredictably based on timing

## Solution

Replace shallow spread with `deepmerge` in the optimistic update.

### Phase 1: Fix Optimistic Update

**File:** `apps/legal-gazette-application-web/src/hooks/useUpdateApplication.ts`

```typescript
import deepmerge from 'deepmerge'

// In onMutate callback (lines 72-78):
const optimisticData: ApplicationDetailedDto = {
  ...prevData,
  answers: deepmerge(
    prevData?.answers ?? {},
    answers as Record<string, unknown>,
    {
      // Use same merge strategy as server for consistency
      customMerge: (key) => {
        if (key === 'companies' || key === 'publishingDates' || key === 'communicationChannels') {
          return (_, incoming) => incoming
        }
      },
    }
  ),
}
```

### Phase 2: Add Type Safety (Optional)

Consider adding a utility function to ensure consistent merge behavior:

```typescript
// libs/legal-gazette/utils/merge-answers.ts
import deepmerge from 'deepmerge'

export const mergeApplicationAnswers = <T extends Record<string, unknown>>(
  current: T,
  incoming: Partial<T>
): T => {
  return deepmerge(current, incoming, {
    customMerge: (key) => {
      if (['companies', 'publishingDates', 'communicationChannels'].includes(key)) {
        return (_, incoming) => incoming
      }
    },
  }) as T
}
```

Then use in both client and server for consistency.

## Files to Modify

| File | Change |
|------|--------|
| `apps/legal-gazette-application-web/src/hooks/useUpdateApplication.ts` | Replace shallow spread with `deepmerge` in `onMutate` |

## Verification

### Test 1: Reproduce the Original Bug (Before Fix)

1. Create a recall bankruptcy application
2. Fill in all settlement fields including `liquidatorName`
3. Go back and change the `name` field
4. Open DevTools → Application → check React Query cache
5. **Before fix:** `liquidatorName` should be missing from cached data

### Test 2: Verify Fix Works

1. Same steps as above
2. **After fix:** All fields should be preserved in cache

### Test 3: End-to-End Submit

1. Create application, fill all fields
2. Make multiple edits to different fields in `settlementFields`
3. Submit application
4. Should succeed without server 400 error

### Test 4: Verify Array Fields Still Work

1. Update `communicationChannels` (should replace, not merge arrays)
2. Update `publishingDates` (should replace, not merge arrays)
3. Verify arrays are replaced correctly, not merged

## Risk Assessment

- **Low Risk**: Only changing client-side cache behavior
- **Backwards Compatible**: Server already uses `deepmerge`, just aligning client
- **Dependency**: `deepmerge` is already used in the API, may need to add to app's dependencies

## Why Previous Diagnosis Was Incomplete

The initial diagnosis focused on debounce timing, which is a real but secondary issue. The primary bug is the **data corruption** from shallow spread, which can happen regardless of timing when multiple fields in the same nested object are updated.
