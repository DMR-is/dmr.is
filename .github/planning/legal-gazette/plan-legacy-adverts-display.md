# Plan: Display My Adverts in Application Web

## Summary

Display all adverts submitted by the authenticated user in the Legal Gazette Application Web. Users should be able to view adverts they have submitted (both legacy and new) as a separate tab alongside their applications.

## Planning Date

December 16, 2024

## Last Updated

December 17, 2024

---

## Background

### Current State

The `ADVERT` table contains both:
1. **New adverts** - Created through the new application system
2. **Legacy adverts** - Migrated from the old Lögbirtingablaðið system, identified by `legacy_id`

Key fields in `AdvertModel`:
- `legacyId` - UUID from the old system (NULL for new adverts, non-NULL for legacy)
- `createdByNationalId` - National ID of the person who submitted the advert

### User Story

As an application-web user, I want to see all my submitted adverts so that I can review my submission history.

### Current Endpoints

The application-web already has:
- `GET /v1/applications/getMyApplications` - Returns applications for the authenticated user

We added a similar endpoint for adverts:
- `GET /v1/adverts/getMyAdverts` - Returns all adverts created by the authenticated user

---

## Implementation Plan

### Phase 1: Backend - API Endpoint ✅ COMPLETED

#### 1.1 Create DTOs for My Adverts

**File:** `apps/legal-gazette-api/src/models/advert.model.ts`

Added new DTOs for the advert list:

```typescript
// DTO for user's advert listing
export class MyAdvertListItemDto {
  @ApiProperty({ type: 'string', format: 'uuid' })
  id: string

  @ApiProperty({ type: 'string', format: 'uuid', nullable: true })
  legacyId: string | null  // NULL for new adverts, non-NULL for legacy

  @ApiProperty({ type: 'string' })
  title: string

  @ApiProperty({ type: 'string', nullable: true })
  publicationNumber: string | null

  @ApiProperty({ type: TypeDto })
  type: TypeDto

  @ApiProperty({ type: CategoryDto })
  category: CategoryDto

  @ApiProperty({ type: StatusDto })
  status: StatusDto

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt: Date

  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  publishedAt: Date | null

  @ApiProperty({ type: 'string', nullable: true })
  html: string | null  // Pre-rendered HTML for modal display
}

export class GetMyAdvertsDto {
  @ApiProperty({ type: [MyAdvertListItemDto] })
  adverts: MyAdvertListItemDto[]

  @ApiProperty({ type: PagingDto })
  paging: PagingDto
}
```

#### 1.2 Add Service Method ✅

**File:** `apps/legal-gazette-api/src/modules/advert/advert.service.interface.ts`

```typescript
export interface IAdvertService {
  // ... existing methods ...

  getMyAdverts(
    query: PagingQuery,
    user: DMRUser,
  ): Promise<GetMyAdvertsDto>
}
```

**File:** `apps/legal-gazette-api/src/modules/advert/advert.service.ts` ✅

```typescript
async getMyAdverts(
  query: PagingQuery,
  user: DMRUser,
): Promise<GetMyAdvertsDto> {
  const { limit, offset } = getLimitAndOffset(query)

  const adverts = await this.advertModel.unscoped().findAndCountAll({
    limit,
    offset,
    where: {
      createdByNationalId: user.nationalId,
    },
    include: [
      { model: TypeModel, attributes: ['id', 'title', 'slug'] },
      { model: CategoryModel, attributes: ['id', 'title', 'slug'] },
      { model: StatusModel, attributes: ['id', 'title', 'slug'] },
      { model: AdvertPublicationModel, attributes: ['publishedAt'] },
    ],
    order: [['createdAt', 'DESC']],
  })

  const mapped: MyAdvertListItemDto[] = adverts.rows.map((advert) => ({
    id: advert.id,
    legacyId: advert.legacyId,
    title: advert.title,
    publicationNumber: advert.publicationNumber,
    type: advert.type.fromModel(),
    category: advert.category.fromModel(),
    status: advert.status.fromModel(),
    createdAt: advert.createdAt,
    publishedAt: advert.publications?.[0]?.publishedAt ?? null,
    html: advert.htmlMarkup(),
  }))

  const paging = generatePaging(
    adverts.rows,
    query.page,
    query.pageSize,
    adverts.count,
  )

  return { adverts: mapped, paging }
}
```

#### 1.3 Add Controller Endpoint ✅

**File:** `apps/legal-gazette-api/src/modules/advert/controllers/advert.controller.ts`

Added endpoint accessible by application-web users:

```typescript
@ApplicationWebScopes()
@Get('getMyAdverts')
@LGResponse({ operationId: 'getMyAdverts', type: GetMyAdvertsDto })
getMyAdverts(@Query() query: PagingQuery, @CurrentUser() user: DMRUser) {
  return this.advertService.getMyAdverts(query, user)
}
```

**Authorization Notes:**
- Uses `@ApplicationWebScopes()` to allow application-web users
- The endpoint filters by `createdByNationalId = user.nationalId` for security
- No need for `@AdminAccess()` since this is user-specific data

---

### Phase 2: Frontend - tRPC Router

#### 2.1 Update Schema and Codegen

Run codegen to generate the new types:

```bash
nx run legal-gazette-api:serve  # Start the API first
nx run legal-gazette-application-web:update-openapi-schema
nx run legal-gazette-application-web:codegen
```

#### 2.2 Add tRPC Route ✅

**File:** `apps/legal-gazette-application-web/src/lib/trpc/server/routers/applicationRouter.ts`

Added route for adverts:

```typescript
export const applicationRouter = router({
  // ... existing routes ...

  getMyAdverts: protectedProcedure
    .input(getApplicationsSchema.optional())
    .query(async ({ ctx, input }) => {
      return await ctx.api.getMyAdverts({
        page: input?.page,
        pageSize: input?.pageSize,
      })
    }),
})
```

---

### Phase 3: Frontend - UI Components

#### 3.1 Create Tabs on Applications Page

**File:** `apps/legal-gazette-application-web/src/containers/ApplicationsContainer.tsx`

Update to include tabs for Applications and Adverts:

```typescript
'use client'

import { useState } from 'react'
import { parseAsInteger, useQueryState } from 'nuqs'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import {
  AlertMessage,
  SkeletonLoader,
  Stack,
  Tabs,
} from '@dmr.is/ui/components/island-is'

import { ApplicationList } from '../components/application/ApplicationList'
import { MyAdvertsList } from '../components/adverts/MyAdvertsList'
import { useTRPC } from '../lib/trpc/client/trpc'

export function ApplicationsContainer() {
  const [activeTab, setActiveTab] = useState<'applications' | 'adverts'>('applications')

  return (
    <Tabs
      selected={activeTab}
      onlyRenderSelectedTab
      tabs={[
        {
          id: 'applications',
          label: 'Umsóknir',
          content: <ApplicationsTab />,
        },
        {
          id: 'adverts',
          label: 'Auglýsingar',
          content: <AdvertsTab />,
        },
      ]}
      onChange={(id) => setActiveTab(id as 'applications' | 'adverts')}
    />
  )
}
```

#### 3.2 Create My Adverts List Component

**File:** `apps/legal-gazette-application-web/src/components/adverts/MyAdvertsList.tsx`

Display adverts in cards similar to ApplicationList, with modal on click:

  if (error) {
    return (
      <AlertMessage
        type="error"
        title="Villa við að sækja auglýsingar"
        message="Vinsamlegast reynið aftur síðar"
      />
    )
  }

  if (!data || data.adverts.length === 0) {
    return (
      <AlertMessage
        type="info"
        title="Engar eldri auglýsingar fundust"
        message="Þú hefur engar auglýsingar frá eldra kerfinu"
      />
    )
  }

  return (
    <Stack space={4}>
      <LegacyAdvertList
        adverts={data.adverts}
        paging={data.paging}
        onPageChange={setPage}
      />
    </Stack>
  )
}
```

#### 3.2 Create Legacy Advert List Component

**File:** `apps/legal-gazette-application-web/src/components/advert/LegacyAdvertList.tsx`

```typescript
import {
  Box,
  Pagination,
  Stack,
  Table,
  Text,
} from '@dmr.is/ui/components/island-is'

import { LegacyAdvertListItemDto, PagingDto } from '../../gen/fetch'

type Props = {
  adverts: LegacyAdvertListItemDto[]
  paging: PagingDto
  onPageChange: (page: number) => void
}

export function LegacyAdvertList({ adverts, paging, onPageChange }: Props) {
  return (
    <Stack space={3}>
      <Table.Table>
        <Table.Head>
          <Table.Row>
            <Table.HeadData>Titill</Table.HeadData>
            <Table.HeadData>Tegund</Table.HeadData>
            <Table.HeadData>Flokkur</Table.HeadData>
            <Table.HeadData>Staða</Table.HeadData>
            <Table.HeadData>Útgáfunúmer</Table.HeadData>
            <Table.HeadData>Dagsetning</Table.HeadData>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {adverts.map((advert) => (
            <Table.Row key={advert.id}>
              <Table.Data>{advert.title}</Table.Data>
              <Table.Data>{advert.type.title}</Table.Data>
              <Table.Data>{advert.category.title}</Table.Data>
              <Table.Data>{advert.status.title}</Table.Data>
              <Table.Data>{advert.publicationNumber ?? '-'}</Table.Data>
              <Table.Data>
                {new Date(advert.createdAt).toLocaleDateString('is-IS')}
              </Table.Data>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Table>

      {paging.totalPages > 1 && (
        <Box display="flex" justifyContent="center">
          <Pagination
            page={paging.page}
            totalPages={paging.totalPages}
            renderLink={(page, className, children) => (
              <button className={className} onClick={() => onPageChange(page)}>
                {children}
              </button>
            )}
          />
        </Box>
      )}
    </Stack>
  )
}
```

#### 3.3 Create Page Route

**File:** `apps/legal-gazette-application-web/src/app/(protected)/eldri-auglysingar/page.tsx`

```typescript
import { Metadata } from 'next'

import { LegacyAdvertsContainer } from '../../../containers/LegacyAdvertsContainer'

export const metadata: Metadata = {
  title: 'Eldri auglýsingar | Lögbirtingablaðið',
}

export default function LegacyAdvertsPage() {
  return <LegacyAdvertsContainer />
}
```

#### 3.4 Add Navigation Link

Update the header or navigation to include a link to the legacy adverts page. Consider adding it to the applications list page or as a separate tab.

---

### Phase 4: Optional Enhancements

#### 4.1 View Legacy Advert Details

Add ability to view the HTML content of legacy adverts:

```typescript
@ApplicationWebScopes()
@Get('getLegacyAdvertById/:id')
@LGResponse({ operationId: 'getLegacyAdvertById', type: LegacyAdvertDetailDto })
async getLegacyAdvertById(
  @Param('id') id: string,
  @CurrentUser() user: DMRUser,
): Promise<LegacyAdvertDetailDto> {
  // Verify ownership and return details including legacyHtml
}
```

#### 4.2 Tabs on Applications Page

Instead of a separate page, add tabs to the `/umsoknir` page:
- Tab 1: "Umsóknir" (current applications)
- Tab 2: "Eldri auglýsingar" (legacy adverts)

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Unauthorized access to others' adverts | Filter by `createdByNationalId = user.nationalId` |
| Scope authorization | Use `@ApplicationWebScopes()` decorator |
| Data exposure | Only return minimal data needed for list view |

---

## Testing Checklist

- [x] API endpoint returns all adverts created by user
- [x] API endpoint filters by authenticated user's nationalId
- [ ] Pagination works correctly
- [ ] Empty state displays when user has no adverts
- [ ] Error states handled gracefully
- [ ] Date formatting is correct (Icelandic locale)
- [ ] Tabs switch between applications and adverts
- [ ] Modal displays advert HTML when clicked
- [ ] Authorization guards prevent unauthorized access

---

## File Summary

### Files Created/Modified

| File | Type | Description | Status |
|------|------|-------------|--------|
| `models/advert.model.ts` | DTO Updates | Add `MyAdvertListItemDto`, `GetMyAdvertsDto` | ✅ Done |
| `advert.service.interface.ts` | Interface | Add `getMyAdverts` method signature | ✅ Done |
| `advert.service.ts` | Service Method | Add `getMyAdverts()` implementation | ✅ Done |
| `advert.controller.ts` | Endpoint | Add `GET /adverts/getMyAdverts` | ✅ Done |
| `applicationRouter.ts` | tRPC Route | Add `getMyAdverts` procedure | ✅ Done |
| `ApplicationsContainer.tsx` | Container | Add tabs for applications and adverts | ✅ Done |
| `MyAdvertsList.tsx` | Component | Card/list display | ✅ Done |
| `AdvertCard.tsx` | Component | Individual advert card with modal | ✅ Done |
| `AdvertPublicationModal.tsx` | Modal | Display advert HTML | ✅ Done |
| `Tabs.tsx` | Component | Reusable tabs component (reakit) | ✅ Done |
| `Tabs.css.ts` | Styles | Tab styling with vanilla-extract | ✅ Done |

---

## Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Backend - API Endpoint | ✅ Complete | DTOs, service, controller all done |
| Phase 2: Frontend - tRPC Router | ✅ Complete | Route added, codegen complete |
| Phase 3: Frontend - UI Components | ✅ Complete | Tabs, list, modal all implemented |
| Phase 4: Optional Enhancements | ⏸️ Deferred | Filtering, etc. |

---

## Decisions Made

1. **Tab vs Separate Page**: ✅ **Tab on the applications page**
   - Add a second tab to the `/umsoknir` page
   - Tab 1: "Umsóknir" (current applications)
   - Tab 2: "Auglýsingar" (all adverts)

2. **Detail View**: ✅ **Modal with advert publication modal**
   - When clicking an advert, display the `AdvertPublicationModal`
   - Uses pre-rendered HTML from `advert.htmlMarkup()`

3. **All Adverts vs Legacy Only**: ✅ **All adverts**
   - Changed from showing only legacy adverts to showing ALL adverts by user
   - `legacyId` field indicates if it's a legacy advert (nullable)

4. **Filtering**: ⏸️ **Skip for now**
   - Can be added in a future iteration if needed

---

## Related Plans

- [TBR Subscription Payment](./plan-tbr-subscription-payment.md) - Payment integration
- [Legacy Data Import](./plan-legacy-data-import.md) - (OBSOLETE) Original legacy migration plan
