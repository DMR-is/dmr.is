# Plan: Related Entities Status Protection (C-1 Extension)

> **Created:** January 2, 2026  
> **Updated:** January 9, 2026  
> **Status:** 🔴 Not Implemented - All Phases Pending  
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

**Note:** Currently uses inline logic instead of shared utility. Should be refactored to use utility from Phase 1.

### ❌ Phases 1-5: Related Entities (NOT IMPLEMENTED)

**Critical Finding:** NO protection exists for related entities:
- Settlement updates can modify data for published adverts
- Signature create/update operations are unprotected
- Communication channel operations are unprotected
- Foreclosure property operations are unprotected

**Risk:** Data integrity violations possible through indirect modifications.

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

### Phase 1: Create Shared Utility ⬜ Not Started

**Status:** NOT IMPLEMENTED - Utility file does not exist

**Current State:**
- ❌ File `apps/legal-gazette-api/src/core/utils/advert-status.util.ts` does not exist
- ❌ No shared utility functions available
- ℹ️ C-1 fix uses inline logic in `advert.service.ts`

**Required Tasks:**
- Create `advert-status.util.ts` with reusable functions
- Refactor C-1 fix to use the utility
- Add unit tests for utility functions

**Estimated Effort:** 1h

---

### Phase 2: Settlement Module ⬜ Not Started

**Status:** NOT IMPLEMENTED - No protection exists

**Current State:**
- ❌ `SettlementService.updateSettlement()` has NO status checks
- ❌ No test file exists (`settlement.service.spec.ts` not found)
- ⚠️ VULNERABLE: Can modify settlement data for published adverts

**Files to Modify:**
- `apps/legal-gazette-api/src/modules/settlement/settlement.service.ts` (line 16: `updateSettlement`)

**Required Tasks:**
- Add tests for settlement update with published advert
- Implement status check in `SettlementService.updateSettlement()`
- Verify tests pass

**Estimated Effort:** 2h

---

### Phase 3: Signature Module ⬜ Not Started

**Status:** NOT IMPLEMENTED - No protection exists

**Current State:**
- ❌ `SignatureService.createSignature()` has NO status checks
- ❌ `SignatureService.updateSignature()` has NO status checks
- ❌ No test file exists (`signature.service.spec.ts` not found)
- ⚠️ VULNERABLE: Can create/modify signatures for published adverts

**Files to Modify:**
- `apps/legal-gazette-api/src/modules/advert/signature/signature.service.ts`
  - Line 35: `updateSignature()`
  - Line 47: `createSignature()`

**Required Tasks:**
- Add tests for signature create/update with published advert
- Implement status checks in signature service methods
- Verify tests pass

**Estimated Effort:** 2h

---

### Phase 4: Communication Channel Module ⬜ Not Started

**Status:** NOT IMPLEMENTED - No protection exists

**Current State:**
- ❌ `CommunicationChannelService.createChannel()` has NO status checks
- ❌ `CommunicationChannelService.updateChannel()` has NO status checks
- ❌ `CommunicationChannelService.deleteChannel()` has NO status checks
- ❌ No test file exists (`communication-channel.service.spec.ts` not found)
- ⚠️ VULNERABLE: Can create/modify/delete channels for published adverts

**Files to Modify:**
- `apps/legal-gazette-api/src/modules/communication-channel/communication-channel.service.ts`
  - Line 26: `createChannel()`
  - Line 41: `deleteChannel()`
  - Line 47: `updateChannel()`

**Required Tasks:**
- Add tests for channel create/update/delete with published advert
- Implement status checks in all CUD operations
- Verify tests pass

**Estimated Effort:** 2h

---

### Phase 5: Foreclosure Module ⬜ Not Started

**Status:** PARTIALLY IMPLEMENTED - Only delete operation protected

**Current State:**
- ✅ `ForeclosureService.deleteForclosureSale()` protected (marks advert as withdrawn)
- ❌ `ForeclosureService.createForeclosureProperty()` has NO status checks
- ❌ `ForeclosureService.deletePropertyFromForeclosure()` has NO status checks
- ⚠️ VULNERABLE: Can add/remove properties for published foreclosure adverts

**Files to Modify:**
- `apps/legal-gazette-api/src/modules/external-systems/foreclosure/foreclosure.service.ts`
  - Line 119: `createForeclosureProperty()`
  - Line 136: `deletePropertyFromForeclosure()`

**Test Coverage:**
- File exists: `apps/legal-gazette-api/src/modules/external-systems/foreclosure/foreclosure.service.spec.ts`
- Tests focus on XSS protection, not status protection

**Required Tasks:**
- Add tests for property add/delete with published advert
- Implement status checks in property operations
- Verify tests pass

**Estimated Effort:** 3h

---

## Testing Checklist

### For Each Module

- [ ] Test: Creating entity when parent advert is PUBLISHED → Should fail
- [ ] Test: Updating entity when parent advert is PUBLISHED → Should fail
- [ ] Test: Deleting entity when parent advert is PUBLISHED → Should fail
- [ ] Test: Creating entity when parent advert is REJECTED → Should fail
- [ ] Test: Creating entity when parent advert is WITHDRAWN → Should fail
- [ ] Test: Operations succeed when advert is SUBMITTED/IN_PROGRESS/READY_FOR_PUBLICATION

---

## Effort Estimation

| Phase | Effort | Priority |
|-------|--------|----------|
| Phase 1: Shared Utility | 1h | High |
| Phase 2: Settlement | 2h | High |
| Phase 3: Signature | 2h | High |
| Phase 4: Communication Channel | 2h | High |
| Phase 5: Foreclosure | 3h | High |
| **Total** | **10h** | |

---

## Status Tracking

| Date | Phase | Status | Notes |
|------|-------|--------|-------|
| Jan 2, 2026 | Research | ✅ Complete | Identified 5 affected modules |
| Jan 9, 2026 | C-1 Core | ✅ Complete | Inline implementation in `advert.service.ts`, full test coverage |
| Jan 9, 2026 | Phase 1 | ⬜ Not Started | Utility file does not exist |
| Jan 9, 2026 | Phase 2 | ⬜ Not Started | Settlement service has no protection |
| Jan 9, 2026 | Phase 3 | ⬜ Not Started | Signature service has no protection |
| Jan 9, 2026 | Phase 4 | ⬜ Not Started | Communication channel service has no protection |
| Jan 9, 2026 | Phase 5 | ⬜ Not Started | Foreclosure property operations have no protection |

---

## Notes

- **C-1 Core Fix:** Implemented inline in `advert.service.ts` with comprehensive test coverage
- **Next Priority:** Phase 1 (shared utility) should be completed before implementing Phases 2-5
- This is an extension of C-1 and should be prioritized after the main critical issues are resolved
- Consider adding API-level documentation warning consumers about status restrictions
- May need to coordinate with frontend to show appropriate error messages
- **Refactoring Opportunity:** Once Phase 1 utility is created, refactor C-1 fix to use shared utility
- **Test Gap:** Related entity services (Settlement, Signature, Communication Channel) lack dedicated test files

---

**Document Owner:** Development Team  
**Last Updated:** January 9, 2026  
**Related Documents:** 
- [plan-critical-issues-tdd-fix.md](plan-critical-issues-tdd-fix.md)
- [plan-code-review-findings.md](plan-code-review-findings.md)
