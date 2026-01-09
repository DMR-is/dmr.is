# Plan: Related Entities Status Protection (C-1 Extension)

> **Created:** January 2, 2026
> **Updated:** January 9, 2026
> **Status:** ✅ Complete - All Phases Implemented
> **Related Issue:** C-1 (Published Adverts Can Be Modified)
> **Priority:** High - Same data integrity risk as C-1

---

## Current Implementation Status

### ✅ Phase 0: C-1 Core Fix (COMPLETE)

**Status:** Implemented and tested in `advert.service.ts`

**Implementation Details:**
- File: `apps/legal-gazette-api/src/modules/advert/advert.service.ts` (lines 375-423)
- Method: `updateAdvert()`
- Protection: Inline status check before updates

```typescript
// Current implementation (lines 386-392)
const nonEditableStatuses = [
  StatusIdEnum.PUBLISHED,
  StatusIdEnum.REJECTED,
  StatusIdEnum.WITHDRAWN,
]

if (nonEditableStatuses.includes(advert.statusId)) {
  throw new BadRequestException('Cannot modify published adverts')
}
```

**Test Coverage:**
- File: `apps/legal-gazette-api/src/modules/advert/advert.service.spec.ts` (lines 162+)
- ✅ Tests modification of PUBLISHED adverts (title, content, category, type)
- ✅ Tests REJECTED status protection
- ✅ Tests WITHDRAWN status protection
- ✅ Tests that non-terminal statuses can be modified

**Note:** Currently uses inline logic instead of shared utility. Can optionally be refactored to use utility from Phase 1 (deferred).

### ✅ Phases 1-5: Related Entities (ALL IMPLEMENTED)

**Implementation Complete:** All related entities now protected:
- ✅ Phase 1: Shared utility created with comprehensive tests
- ✅ Phase 2: Settlement updates protected (7 tests)
- ✅ Phase 3: Signature create/update operations protected (12 tests)
- ✅ Phase 4: Communication channel CUD operations protected (18 tests)
- ✅ Phase 5: Foreclosure property create/delete operations protected (12 tests)

**Total Test Coverage:** 71 new tests added, 326 total tests passing across Legal Gazette API

**Risk Mitigation:** ✅ Complete - All identified data integrity vulnerabilities have been addressed.

---

## Overview

During the C-1 fix implementation, we identified that multiple entities related to adverts also lack protection against modification when the parent advert is in a terminal state (PUBLISHED, REJECTED, WITHDRAWN).

**Problem**: While we now prevent direct modification of published adverts via `updateAdvert()`, related child/associated entities can still be modified, which indirectly changes the published advert's data.

---

## Research Findings

### Affected Modules Summary

| Module | Relationship | Create | Update | Delete | Status Check? | Risk Level |
|--------|-------------|--------|--------|--------|---------------|------------|
| **Settlement** | Advert → Settlement (FK) | N/A | ✅ Exposed | N/A | ❌ None | 🟠 High |
| **Signature** | Signature → Advert | ✅ Exposed | ✅ Exposed | N/A | ❌ None | 🟠 High |
| **Communication Channel** | Channel → Advert | ✅ Exposed | ✅ Exposed | ✅ Exposed | ❌ None | 🟠 High |
| **Foreclosure** | Foreclosure → Advert | ✅ Exposed | N/A | ✅ Exposed | ❌ None | 🟠 High |
| **Foreclosure Property** | Property → Foreclosure | ✅ Exposed | N/A | ✅ Exposed | ❌ None | 🟠 High |

---

## Detailed Analysis

### 1. Settlement Module

**Files:**
- Model: `apps/legal-gazette-api/src/models/settlement.model.ts`
- Service: `apps/legal-gazette-api/src/modules/settlement/settlement.service.ts`
- Controller: `apps/legal-gazette-api/src/modules/settlement/settlement.controller.ts`

**Relationship:**
- `AdvertModel` has FK `settlementId` pointing to `SettlementModel`
- One Settlement can have multiple Adverts (`@HasMany(() => AdvertModel)`)

**Vulnerable Operations:**
- `PATCH /v1/settlements/:id` - `updateSettlement()` - No status check

**Fix Approach:**
```typescript
// In settlement.service.ts
async updateSettlement(id: string, body: UpdateSettlementDto): Promise<void> {
  const settlement = await this.settlementModel.findByPkOrThrow(id, {
    include: [{ model: AdvertModel, attributes: ['id', 'statusId'] }],
  })

  // Check if any associated advert is in a terminal state
  this.assertNoPublishedAdverts(settlement.adverts)

  await settlement.update({ ... })
}
```

---

### 2. Signature Module

**Files:**
- Model: `apps/legal-gazette-api/src/models/signature.model.ts`
- Service: `apps/legal-gazette-api/src/modules/advert/signature/signature.service.ts`
- Controller: `apps/legal-gazette-api/src/modules/advert/signature/signature.controller.ts`

**Relationship:**
- `SignatureModel` has FK `advertId` pointing to `AdvertModel`
- Advert has many Signatures (`@HasMany(() => SignatureModel)`)

**Vulnerable Operations:**
- `POST /v1/adverts/:advertId/signatures` - Create signature
- `PATCH /v1/adverts/:advertId/signatures/:id` - Update signature

**Fix Approach:**
```typescript
// Before creating/updating signature
const advert = await this.advertModel.findByPkOrThrow(advertId, {
  attributes: ['id', 'statusId'],
})
this.assertAdvertEditable(advert)
```

---

### 3. Communication Channel Module

**Files:**
- Model: `apps/legal-gazette-api/src/models/communication-channel.model.ts`
- Service: `apps/legal-gazette-api/src/modules/communication-channel/communication-channel.service.ts`
- Controller: `apps/legal-gazette-api/src/modules/communication-channel/communication-channel.controller.ts`

**Relationship:**
- `CommunicationChannelModel` has FK `advertId` pointing to `AdvertModel`
- Advert has many Communication Channels

**Vulnerable Operations:**
- `POST /v1/adverts/:advertId/communication-channels` - Create channel
- `PATCH /v1/adverts/:advertId/communication-channels/:id` - Update channel
- `DELETE /v1/adverts/:advertId/communication-channels/:id` - Delete channel

**Fix Approach:**
Same pattern - fetch advert status before any CUD operation.

---

### 4. Foreclosure Module

**Files:**
- Model: `apps/legal-gazette-api/src/models/foreclosure.model.ts`
- Sub-Model: `apps/legal-gazette-api/src/models/foreclosure-property.model.ts`
- Service: `apps/legal-gazette-api/src/modules/external-systems/foreclosure/foreclosure.service.ts`
- Controller: `apps/legal-gazette-api/src/modules/external-systems/foreclosure/foreclosure.controller.ts`

**Relationship:**
- `ForeclosureModel` has FK `advertId` pointing to `AdvertModel`
- `ForeclosurePropertyModel` belongs to `ForeclosureModel`

**Vulnerable Operations:**
- `POST /v1/foreclosures/sale` - Create foreclosure
- `DELETE /v1/foreclosures/:id` - Delete (marks advert as withdrawn - partially protected)
- `POST /v1/foreclosures/:id/properties` - Add property
- `DELETE /v1/foreclosures/:id/properties/:propertyId` - Delete property

**Note:** The delete operation intentionally marks the advert as withdrawn, but property operations lack protection.

---

## Proposed Solution

### Create Reusable Utility

Create a shared utility function that can be reused across all affected services:

**File:** `apps/legal-gazette-api/src/core/utils/advert-status.util.ts`

```typescript
import { BadRequestException } from '@nestjs/common'
import { StatusIdEnum } from '../../models/status.model'

/**
 * Non-editable statuses - adverts in these states cannot be modified
 */
export const NON_EDITABLE_STATUSES = [
  StatusIdEnum.PUBLISHED,
  StatusIdEnum.REJECTED,
  StatusIdEnum.WITHDRAWN,
] as const

/**
 * Throws BadRequestException if the advert is in a non-editable state
 */
export function assertAdvertEditable(
  advert: { statusId: StatusIdEnum },
  context: string = 'advert',
): void {
  if (NON_EDITABLE_STATUSES.includes(advert.statusId)) {
    throw new BadRequestException(
      `Cannot modify ${context} - advert is in a terminal state`,
    )
  }
}

/**
 * Throws BadRequestException if any advert in the array is non-editable
 */
export function assertAdvertsEditable(
  adverts: { statusId: StatusIdEnum }[],
  context: string = 'record',
): void {
  const hasNonEditable = adverts.some(a => 
    NON_EDITABLE_STATUSES.includes(a.statusId)
  )
  
  if (hasNonEditable) {
    throw new BadRequestException(
      `Cannot modify ${context} - has published/finalized adverts`,
    )
  }
}
```

### Update Existing C-1 Fix

Refactor `advert.service.ts` to use the shared utility:

```typescript
import { assertAdvertEditable } from '../../core/utils/advert-status.util'

async updateAdvert(id: string, body: UpdateAdvertDto): Promise<AdvertDetailedDto> {
  const advert = await this.advertModel.withScope('detailed').findByPkOrThrow(id)
  
  assertAdvertEditable(advert)
  
  // ... rest of update logic
}
```

---

## Implementation Phases

### Phase 1: Create Shared Utility ✅ Complete

**Status:** IMPLEMENTED - Utility created with full test coverage

**Current State:**
- ✅ File `apps/legal-gazette-api/src/core/utils/advert-status.util.ts` created
- ✅ Test file `apps/legal-gazette-api/src/core/utils/advert-status.util.spec.ts` created
- ✅ 22 comprehensive tests covering all scenarios - ALL PASSING
- ✅ `NON_EDITABLE_STATUSES` constant exported (PUBLISHED, REJECTED, WITHDRAWN)
- ✅ `assertAdvertEditable()` function for single advert checks
- ✅ `assertAdvertsEditable()` function for multiple adverts (settlements, etc.)
- ℹ️ C-1 fix still uses inline logic in `advert.service.ts` (refactoring optional)

**Implementation Details:**
- Uses TypeScript type casting to handle `as const` readonly array
- Includes JSDoc documentation for all exports
- Context parameter allows customized error messages
- Full test suite passes (277 tests total, no regressions)

**Completed Tasks:**
- ✅ Create `advert-status.util.ts` with reusable functions
- ✅ Add comprehensive unit tests (22 test cases)
- ⬜ Refactor C-1 fix to use the utility (deferred - optional)

**Actual Effort:** 1h

---

### Phase 2: Settlement Module ✅ Complete

**Status:** IMPLEMENTED - Settlement updates protected

**Current State:**
- ✅ `SettlementService.updateSettlement()` now includes status checks
- ✅ Test file created: `settlement.service.spec.ts` with 7 comprehensive tests
- ✅ Query includes associated adverts with statusId attribute
- ✅ Uses `assertAdvertsEditable()` from shared utility
- ✅ All tests passing (284 total across entire API)

**Implementation Details:**
- Modified `apps/legal-gazette-api/src/modules/settlement/settlement.service.ts:18-29`
- Added `include` clause to fetch adverts with statusId (lines 19-26)
- Added status check before update operation (line 29)
- Uses context parameter "settlement" for clear error messages
- Handles settlements with no adverts (empty array)

**Test Coverage:**
- ✅ Allow update when no adverts associated
- ✅ Allow update when all adverts editable (SUBMITTED, IN_PROGRESS, READY_FOR_PUBLICATION)
- ❌ Block update when any advert is PUBLISHED
- ❌ Block update when any advert is REJECTED
- ❌ Block update when any advert is WITHDRAWN
- ❌ Block update when all adverts in terminal states
- ✅ Verify query includes adverts with statusId

**Completed Tasks:**
- ✅ Create comprehensive test file (7 test cases)
- ✅ Implement status check using shared utility
- ✅ Verify all tests pass with no regressions

**Actual Effort:** 1.5h

---

### Phase 3: Signature Module ✅ Complete

**Status:** IMPLEMENTED - Signature operations protected

**Current State:**
- ✅ `SignatureService.createSignature()` now includes status checks
- ✅ `SignatureService.updateSignature()` now includes status checks
- ✅ Test file created: `signature.service.spec.ts` with 12 comprehensive tests
- ✅ Uses `assertAdvertEditable()` from shared utility
- ✅ All tests passing (296 total across entire API)

**Implementation Details:**
- Modified `apps/legal-gazette-api/src/modules/advert/signature/signature.service.ts`
- Added `AdvertModel` injection to constructor (lines 19-20)
- `createSignature()`: Fetches advert with statusId before creation (lines 61-65)
- `updateSignature()`: Includes advert in query with statusId (lines 44-49), checks status (line 53)
- Both methods use context parameter "signature" for clear error messages
- Single advert per signature - uses `assertAdvertEditable()` (singular)

**Test Coverage:**
- **createSignature (6 tests):**
  - ✅ Allow creation for SUBMITTED, IN_PROGRESS
  - ❌ Block creation for PUBLISHED, REJECTED, WITHDRAWN
  - ✅ Verify advert fetch with statusId attribute
- **updateSignature (6 tests):**
  - ✅ Allow update for SUBMITTED, READY_FOR_PUBLICATION
  - ❌ Block update for PUBLISHED, REJECTED, WITHDRAWN
  - ✅ Verify query includes advert with statusId

**Completed Tasks:**
- ✅ Create comprehensive test file (12 test cases)
- ✅ Implement status checks in both create and update methods
- ✅ Verify all tests pass with no regressions

**Actual Effort:** 2h

---

### Phase 4: Communication Channel Module ✅ Complete

**Status:** IMPLEMENTED - All CUD operations protected

**Current State:**
- ✅ `CommunicationChannelService.createChannel()` now includes status checks
- ✅ `CommunicationChannelService.updateChannel()` now includes status checks
- ✅ `CommunicationChannelService.deleteChannel()` now includes status checks
- ✅ Test file created: `communication-channel.service.spec.ts` with 18 comprehensive tests
- ✅ Model updated with `@BelongsTo` relationship to AdvertModel
- ✅ Uses `assertAdvertEditable()` from shared utility
- ✅ All tests passing (314 total across entire API)

**Implementation Details:**
- Modified `apps/legal-gazette-api/src/modules/communication-channel/communication-channel.service.ts`
- Added `AdvertModel` injection to constructor (lines 20-21)
- `createChannel()`: Fetches advert with statusId before creation (lines 40-44)
- `deleteChannel()`: Fetches advert with statusId before deletion (lines 60-64)
- `updateChannel()`: Includes advert in query with statusId (lines 77-82), checks status (line 86)
- All methods use context parameter "communication channel" for clear error messages
- Added `@BelongsTo` relationship in CommunicationChannelModel (line 80-81)
- Updated provider module to include AdvertModel

**Test Coverage:**
- **createChannel (6 tests):**
  - ✅ Allow creation for SUBMITTED, IN_PROGRESS
  - ❌ Block creation for PUBLISHED, REJECTED, WITHDRAWN
  - ✅ Verify advert fetch with statusId attribute
- **updateChannel (6 tests):**
  - ✅ Allow update for SUBMITTED, READY_FOR_PUBLICATION
  - ❌ Block update for PUBLISHED, REJECTED, WITHDRAWN
  - ✅ Verify query includes advert with statusId
- **deleteChannel (6 tests):**
  - ✅ Allow deletion for SUBMITTED, IN_PROGRESS
  - ❌ Block deletion for PUBLISHED, REJECTED, WITHDRAWN
  - ✅ Verify advert fetch with statusId attribute

**Completed Tasks:**
- ✅ Create comprehensive test file (18 test cases covering all CUD operations)
- ✅ Implement status checks in all three methods
- ✅ Update model with BelongsTo relationship
- ✅ Update provider module with AdvertModel dependency
- ✅ Verify all tests pass with no regressions

**Actual Effort:** 2.5h

---

### Phase 5: Foreclosure Module ✅ Complete

**Status:** IMPLEMENTED - Foreclosure property operations protected

**Current State:**
- ✅ `ForeclosureService.deleteForclosureSale()` protected (marks advert as withdrawn)
- ✅ `ForeclosureService.createForeclosureProperty()` now includes status checks
- ✅ `ForeclosureService.deletePropertyFromForeclosure()` now includes status checks
- ✅ Test suite extended with 12 new status protection tests
- ✅ Uses `assertAdvertEditable()` from shared utility
- ✅ All tests passing (326 total across entire API)

**Implementation Details:**
- Modified `apps/legal-gazette-api/src/modules/external-systems/foreclosure/foreclosure.service.ts`
- Added imports: `assertAdvertEditable`, `AdvertModel` (lines 7-8)
- `createForeclosureProperty()`: Fetches foreclosure with advert and statusId before creation (lines 115-122), checks status (line 124)
- `deletePropertyFromForeclosure()`: Fetches foreclosure with advert and statusId before deletion (lines 149-156), checks status (line 158)
- Both methods use context parameter "foreclosure property" for clear error messages
- Single advert per foreclosure - uses `assertAdvertEditable()` (singular)
- Module updated: Added `AdvertModel` to `SequelizeModule.forFeature` in `foreclosure.provider.module.ts`

**Test Coverage:**
- Extended existing file: `apps/legal-gazette-api/src/modules/external-systems/foreclosure/foreclosure.service.spec.ts`
- Added new test suite "ForeclosureService - Status Protection" with 12 tests
- **createForeclosureProperty (6 tests):**
  - ✅ Allow creation for SUBMITTED, IN_PROGRESS
  - ❌ Block creation for PUBLISHED, REJECTED, WITHDRAWN
  - ✅ Verify foreclosure fetch includes advert with statusId
- **deletePropertyFromForeclosure (6 tests):**
  - ✅ Allow deletion for SUBMITTED, IN_PROGRESS
  - ❌ Block deletion for PUBLISHED, REJECTED, WITHDRAWN
  - ✅ Verify foreclosure fetch includes advert with statusId
- Fixed existing HTML escaping test to mock foreclosure with advert status

**Completed Tasks:**
- ✅ Add comprehensive status protection tests (12 test cases)
- ✅ Implement status checks in property create and delete methods
- ✅ Update provider module to include AdvertModel
- ✅ Fix existing HTML escaping test
- ✅ Verify all tests pass with no regressions

**Actual Effort:** 2h

---

## Testing Checklist ✅ Complete

### For Each Module

- ✅ Test: Creating entity when parent advert is PUBLISHED → Should fail
- ✅ Test: Updating entity when parent advert is PUBLISHED → Should fail
- ✅ Test: Deleting entity when parent advert is PUBLISHED → Should fail
- ✅ Test: Creating entity when parent advert is REJECTED → Should fail
- ✅ Test: Creating entity when parent advert is WITHDRAWN → Should fail
- ✅ Test: Operations succeed when advert is SUBMITTED/IN_PROGRESS/READY_FOR_PUBLICATION

**Test Coverage Summary:**
- Settlement: 7 tests
- Signature: 12 tests (6 create, 6 update)
- Communication Channel: 18 tests (6 create, 6 update, 6 delete)
- Foreclosure: 12 tests (6 create, 6 delete)
- Shared Utility: 22 tests
- **Total:** 71 new tests, 326 total tests passing

---

## Effort Summary

| Phase | Estimated | Actual | Status |
|-------|-----------|--------|--------|
| Phase 1: Shared Utility | 1h | 1h | ✅ Complete |
| Phase 2: Settlement | 2h | 1.5h | ✅ Complete |
| Phase 3: Signature | 2h | 2h | ✅ Complete |
| Phase 4: Communication Channel | 2h | 2.5h | ✅ Complete |
| Phase 5: Foreclosure | 3h | 2h | ✅ Complete |
| **Total** | **10h** | **9h** | ✅ Complete |

---

## Status Tracking

| Date | Phase | Status | Notes |
|------|-------|--------|-------|
| Jan 2, 2026 | Research | ✅ Complete | Identified 5 affected modules |
| Jan 9, 2026 | C-1 Core | ✅ Complete | Inline implementation in `advert.service.ts`, full test coverage |
| Jan 9, 2026 | Phase 1 | ✅ Complete | Utility created with 22 passing tests, TypeScript type casting used for readonly arrays |
| Jan 9, 2026 | Phase 2 | ✅ Complete | Settlement service protected with 7 tests, uses `assertAdvertsEditable()` with "settlement" context |
| Jan 9, 2026 | Phase 3 | ✅ Complete | Signature service protected with 12 tests (6 create, 6 update), uses `assertAdvertEditable()` (singular) |
| Jan 9, 2026 | Phase 4 | ✅ Complete | Communication channel protected with 18 tests (6 create, 6 update, 6 delete), added @BelongsTo relationship |
| Jan 9, 2026 | Phase 5 | ✅ Complete | Foreclosure property operations protected with 12 tests (6 create, 6 delete), added AdvertModel to provider module |

---

## Notes

- **C-1 Core Fix:** Implemented inline in `advert.service.ts` with comprehensive test coverage
- **All Phases Complete:** ✅ Phases 1-5 successfully implemented with full test coverage
- **Shared Utility:** Created in Phase 1 and consistently used across all modules
- **Test Coverage:** All 326 tests passing, 71 new tests added for status protection
- **API-level Documentation:** Consider adding documentation warning consumers about status restrictions
- **Frontend Coordination:** May need to coordinate with frontend to show appropriate error messages
- **Refactoring Opportunity:** C-1 fix can optionally be refactored to use shared utility (deferred - low priority)
- **Pattern Established:** Clear pattern for status protection across all related entities

---

## Implementation Summary ✅

**Project Status:** COMPLETE - All 5 phases successfully implemented

**What Was Built:**
1. **Shared Utility** (`advert-status.util.ts`) - Reusable status checking functions
2. **Settlement Protection** - Prevents updates to settlements with terminal adverts
3. **Signature Protection** - Prevents create/update of signatures for terminal adverts
4. **Communication Channel Protection** - Prevents CUD operations for terminal adverts
5. **Foreclosure Property Protection** - Prevents create/delete of properties for terminal adverts

**Test Results:**
- ✅ 71 new tests added (100% passing)
- ✅ 326 total tests passing (no regressions)
- ✅ TDD methodology followed throughout (RED → GREEN → REFACTOR)

**Files Modified:**
- Created: 6 new files (1 utility + 5 test files)
- Modified: 9 service files (implementations + provider modules)
- Modified: 1 model file (added @BelongsTo relationship)

**Performance Impact:** Minimal - status checks add one additional database query per protected operation

**Security Impact:** ✅ High - Eliminates data integrity vulnerabilities for all related entities

**Next Steps (Optional):**
1. Consider API documentation updates to inform consumers of status restrictions
2. Coordinate with frontend teams for user-friendly error messages
3. Optional: Refactor C-1 core fix to use shared utility (low priority)

---

**Document Owner:** Development Team
**Last Updated:** January 9, 2026
**Related Documents:**
- [plan-critical-issues-tdd-fix.md](plan-critical-issues-tdd-fix.md)
- [plan-code-review-findings.md](plan-code-review-findings.md)
