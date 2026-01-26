# Plan: Local-First Form Storage for Legal Gazette Application Web

## Summary

Replace the current auto-save-to-server form handling with a local-first approach:

- **Current**: Every field change triggers debounced API call → server stores data → optimistic cache update (buggy)
- **New**: Field changes save to localStorage → server sync only on navigation (Next/Back/Submit)

This change:

1. Fixes the data corruption bug caused by shallow spread in optimistic updates
2. Improves user experience by eliminating network latency for field changes
3. Preserves form data if the browser closes unexpectedly

## Problem Statement

### Current Bug (from plan-recall-validation-errors.md)

The `useUpdateApplication` hook uses shallow spread in optimistic updates:

```typescript
const optimisticData: ApplicationDetailedDto = {
  ...prevData,
  answers: {
    ...prevData?.answers,
    ...answers,  // SHALLOW SPREAD - replaces nested objects entirely!
  },
}
```

When updating a nested field like `settlementFields.name`, this replaces the entire `settlementFields` object, losing sibling properties like `liquidatorName`.

### Why Local-First Solves This

By storing changes in localStorage and only submitting complete form data on navigation:

1. No more partial updates to the server
2. No optimistic cache corruption
3. Server receives the full form state each time

## Requirements

| Requirement | Behavior |
|-------------|----------|
| Field changes | Save to localStorage immediately (no server call) |
| Next button | Validate → merge localStorage + form → submit to server |
| Back button | Same as Next (both directions save) |
| Final submit | Submit → clear localStorage |
| Browser close | Changes preserved in localStorage |
| Page refresh | Hydrate form from localStorage |
| Multi-tab | Latest tab wins (simple overwrite) |
| Deep merge bug | Fix with `deepmerge` library as safety net |

## Implementation Phases

### Phase 1: Create localStorage Hook

**Status**: ⬜ Not started

Create `useLocalFormStorage.ts` hook with:

- `loadFromStorage()` - Load data for application ID
- `saveToStorage(data)` - Save with deepmerge
- `clearStorage()` - Remove data for application ID
- `getMergedData(current)` - Merge localStorage with current form data

### Phase 2: Fix deepmerge Bug in useUpdateApplication

**Status**: ⬜ Not started

Replace shallow spread with `deepmerge` in `onMutate` callback:

```typescript
import deepmerge from 'deepmerge'

// Replace:
answers: { ...prevData?.answers, ...answers }

// With:
answers: deepmerge(prevData?.answers || {}, answers, {
  arrayMerge: (_dest, source) => source,
})
```

### Phase 3: Add updateLocalOnly to useUpdateApplication

**Status**: ⬜ Not started

New function that:

1. Saves to localStorage
2. Updates React Query cache (for immediate UI update)
3. Does NOT call the server

### Phase 4: Update CommonFormContainer

**Status**: ⬜ Not started

Changes:

1. On mount: hydrate form from localStorage
2. On submit: clear localStorage after successful validation
3. Pass `updateLocalOnly` to field components via context or props

### Phase 5: Update ApplicationFooter

**Status**: ⬜ Not started

Changes:

1. `goBack`: Merge form + localStorage → submit to server
2. `goForward`: Validate → merge form + localStorage → submit to server
3. Use `getMergedData()` to get complete form state

### Phase 6: Update Field Components

**Status**: ⬜ Not started

For each field component using `debouncedUpdateApplication`:

1. Replace with `updateLocalOnly` (no server call)
2. Remove success/error toast messages for field changes
3. Keep immediate `updateApplication` for type/category changes (if needed)

**Components to update:**

- `SignatureFields.tsx`
- `CommonAdvertFields.tsx`
- `RecallSettlementFields.tsx`
- `CommunicationChannelsField.tsx`
- `PublishingDatesField.tsx`
- Other field components as identified

### Phase 7: Update RecallFormContainer

**Status**: ⬜ Not started

Apply same changes as CommonFormContainer to RecallFormContainer.

### Phase 8: Testing

**Status**: ⬜ Not started

Test scenarios:

1. Fill form → refresh page → data preserved
2. Fill form → navigate Next → data on server
3. Fill form → navigate Back → data on server
4. Fill nested fields → verify no data loss (deepmerge fix)
5. Open two tabs → edit in both → latest saves (no conflict)
6. Close browser → reopen → data preserved
7. Final submit → localStorage cleared

## Files to Create

| File | Purpose |
|------|---------|
| `apps/legal-gazette-application-web/src/hooks/useLocalFormStorage.ts` | localStorage management |

## Files to Modify

| File | Changes |
|------|---------|
| `apps/legal-gazette-application-web/src/hooks/useUpdateApplication.ts` | deepmerge fix, add `updateLocalOnly` |
| `apps/legal-gazette-application-web/src/containers/CommonFormContainer.tsx` | Hydrate from localStorage, clear on submit |
| `apps/legal-gazette-application-web/src/containers/RecallFormContainer.tsx` | Same as Common |
| `apps/legal-gazette-application-web/src/components/application/footer/ApplicationFooter.tsx` | Merge & sync on navigation |
| `apps/legal-gazette-application-web/src/components/form/fields/SignatureFields.tsx` | Use `updateLocalOnly` |
| `apps/legal-gazette-application-web/src/components/form/common/fields/CommonAdvertFields.tsx` | Use `updateLocalOnly` |
| Additional field components | Replace `debouncedUpdateApplication` |

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `deepmerge` | ^4.x | Deep merge for nested objects |

**Note**: `deepmerge` is already used in the backend (`apps/legal-gazette-api/src/modules/applications/application.service.ts`), so it may already be installed.

## Architecture Decisions

### Decision 1: Minimal vs Clean Architecture

**Choice**: Minimal approach
**Rationale**: Solves the immediate problem with fewer files and lower complexity. Can refactor to clean architecture later if needed.

### Decision 2: Latest Tab Wins

**Choice**: No conflict resolution, simple overwrite
**Rationale**: User requirement. Reduces complexity and cognitive load.

### Decision 3: Both Navigation Directions Save

**Choice**: Next AND Back buttons both submit to server
**Rationale**: User requirement. Prevents data loss when going backward.

### Decision 4: Fix deepmerge + Local-First

**Choice**: Implement both fixes
**Rationale**: deepmerge fix provides safety net even with local-first approach. Belt and suspenders.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| localStorage quota exceeded | Low | Medium | try-catch, graceful degradation |
| Browser doesn't support localStorage | Very Low | High | Feature detection, fallback to current behavior |
| Multi-tab data loss | Medium | Low | User expectation set (latest wins) |
| Stale localStorage data conflicts with server | Low | Medium | Clear localStorage on successful sync |

## Security Considerations

- **PII in localStorage**: Form data may contain national IDs. localStorage is scoped to domain and not accessible to other sites. Acceptable risk.
- **Clear on logout**: Consider clearing all form localStorage on user logout (future enhancement).

## Testing Checklist

- [ ] Form hydrates from localStorage on page load
- [ ] Field changes save to localStorage (check DevTools → Application → Local Storage)
- [ ] Next button syncs to server and clears localStorage
- [ ] Back button syncs to server and clears localStorage
- [ ] Final submit clears localStorage
- [ ] Multi-tab: second tab overwrites first tab's localStorage
- [ ] Browser close/reopen preserves form data
- [ ] Nested field updates don't lose sibling fields (deepmerge fix)
- [ ] Type/category changes still sync immediately (if keeping that behavior)
- [ ] Recall forms work same as Common forms

## Rollback Plan

If issues arise:

1. Revert to previous commit
2. The deepmerge fix can be kept separately (it's a pure improvement)

## Status Tracking

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: localStorage Hook | ⬜ Not started | |
| Phase 2: deepmerge Bug Fix | ⬜ Not started | |
| Phase 3: updateLocalOnly | ⬜ Not started | |
| Phase 4: CommonFormContainer | ⬜ Not started | |
| Phase 5: ApplicationFooter | ⬜ Not started | |
| Phase 6: Field Components | ⬜ Not started | |
| Phase 7: RecallFormContainer | ⬜ Not started | |
| Phase 8: Testing | ⬜ Not started | |

## Estimated Scope

- **Files to create**: 1
- **Files to modify**: 6-10
- **Dependencies to add**: 0-1 (deepmerge may already exist)
