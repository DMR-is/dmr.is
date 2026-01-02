# Plan: Related Entities Status Protection (C-1 Extension)

> **Created:** January 2, 2026  
> **Status:** 🟡 Research Complete - Implementation Pending  
> **Related Issue:** C-1 (Published Adverts Can Be Modified)  
> **Priority:** High - Same data integrity risk as C-1

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
- Create `advert-status.util.ts` with reusable functions
- Refactor C-1 fix to use the utility
- Add unit tests for utility functions

### Phase 2: Settlement Module ⬜ Not Started
- Add tests for settlement update with published advert
- Implement status check in `SettlementService.updateSettlement()`
- Verify tests pass

### Phase 3: Signature Module ⬜ Not Started
- Add tests for signature create/update with published advert
- Implement status checks in signature service
- Verify tests pass

### Phase 4: Communication Channel Module ⬜ Not Started
- Add tests for channel create/update/delete with published advert
- Implement status checks in communication channel service
- Verify tests pass

### Phase 5: Foreclosure Module ⬜ Not Started
- Add tests for property add/delete with published advert
- Implement status checks in foreclosure service
- Verify tests pass

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
| | Phase 1 | ⬜ Not Started | |
| | Phase 2 | ⬜ Not Started | |
| | Phase 3 | ⬜ Not Started | |
| | Phase 4 | ⬜ Not Started | |
| | Phase 5 | ⬜ Not Started | |

---

## Notes

- This is an extension of C-1 and should be prioritized after the main critical issues are resolved
- Consider adding API-level documentation warning consumers about status restrictions
- May need to coordinate with frontend to show appropriate error messages

---

**Document Owner:** Development Team  
**Last Updated:** January 2, 2026  
**Related Documents:** 
- [plan-critical-issues-tdd-fix.md](plan-critical-issues-tdd-fix.md)
- [plan-code-review-findings.md](plan-code-review-findings.md)
