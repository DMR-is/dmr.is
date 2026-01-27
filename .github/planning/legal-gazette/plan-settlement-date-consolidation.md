# Plan: Settlement Date Consolidation Migration

> **Created:** January 27, 2026  
> **Target Completion:** February 3, 2026  
> **Status:** 🔵 Planning  
> **Last Updated:** January 27, 2026

---

## Overview

Refactor the `SETTLEMENT` table to consolidate two separate date columns (`deadline_date` and `date_of_death`) into a single `date` column. This simplification reduces redundancy and clarifies the data model, as these dates serve the same purpose depending on the settlement type.

### Current State

```typescript
// settlement.model.ts
@Column({
  type: DataType.DATE,
  allowNull: true,
  defaultValue: null,
  field: 'deadline_date',
})
deadline!: Date | null

@Column({
  type: DataType.DATE,
  allowNull: true,
  defaultValue: null,
  field: 'date_of_death',
})
dateOfDeath!: Date | null
```

### Target State

```typescript
// settlement.model.ts
@Column({
  type: DataType.DATE,
  allowNull: true,
  defaultValue: null,
  field: 'date',
})
date!: Date | null
```

### Rationale

1. **Single Responsibility**: Only one date is ever used at a time based on `settlement.type`
2. **Reduced Complexity**: Frontend and backend code won't need to choose between two date fields
3. **Clearer Intent**: A single `date` field with context from `type` is more maintainable
4. **Data Integrity**: Prevents scenarios where both fields are populated incorrectly

---

## Impact Analysis

### Database

**Tables Affected:**

- ✅ `SETTLEMENT` table (direct change)

**Columns:**

- ❌ Drop: `DEADLINE_DATE`
- ❌ Drop: `DATE_OF_DEATH`
- ✅ Add: `DATE`

**Data Migration Required:** Yes

- Need to merge existing `deadline_date` and `date_of_death` data into new `date` column
- Strategy: `COALESCE(deadline_date, date_of_death)` to preserve existing data

### Backend API

**Files Requiring Changes:**

| File                                                                 | Lines | Changes Required                                    |
| -------------------------------------------------------------------- | ----- | --------------------------------------------------- |
| `apps/legal-gazette-api/src/models/settlement.model.ts`              | ~50   | Update model definition, DTOs, types                |
| `apps/legal-gazette-api/src/core/settlements/settlement.service.ts`  | ?     | Update service logic referencing date fields        |
| `apps/legal-gazette-api/src/modules/*/foreclosure.service.ts`        | ?     | Update foreclosure-related settlement date handling |
| `apps/legal-gazette-api/src/modules/*/recall-application.service.ts` | ?     | Update recall application date handling             |

**API Endpoints Affected:**

- All endpoints returning `SettlementDto` (date format changes)
- All endpoints accepting `CreateSettlementDto` or `UpdateSettlementDto`

### Frontend Applications

**Apps Potentially Affected:**

| App                             | Impact | Files to Check                             |
| ------------------------------- | ------ | ------------------------------------------ |
| `legal-gazette-web`             | High   | Admin forms, settlement display components |
| `legal-gazette-application-web` | High   | Application submission forms               |
| `legal-gazette-public-web`      | Medium | Public settlement viewing                  |

**Component Files:**

- `SettlementFields.tsx` ✅ (Currently open in editor)
- Any component referencing `deadline` or `dateOfDeath` properties

### Testing

**Test Files Requiring Updates:**

| Test File                            | Scope       | Changes                           |
| ------------------------------------ | ----------- | --------------------------------- |
| `settlement.model.spec.ts`           | Unit        | Update model test fixtures        |
| `settlement.service.spec.ts`         | Unit        | Update service tests              |
| `foreclosure.service.spec.ts`        | Integration | Update settlement date assertions |
| `recall-application.service.spec.ts` | Integration | Update date validations           |
| E2E tests                            | End-to-End  | Update API response expectations  |

---

## Implementation Phases

### Phase 1: Database Migration ⏸️ Not Started

**Goal:** Create and test database migration to consolidate date columns.

**Steps:**

1. **Create Migration File**

   ```bash
   nx run legal-gazette-api:migrate/generate -- --name settlement-date-consolidation
   ```

   Expected file: `apps/legal-gazette-api/db/migrations/m-20260127-settlement-date-consolidation.js`

2. **Write Migration Logic**

   ```sql
   -- UP migration
   BEGIN;

   -- Add new date column
   ALTER TABLE SETTLEMENT
     ADD COLUMN IF NOT EXISTS DATE TIMESTAMPTZ DEFAULT NULL;

   -- Migrate existing data (prefer deadline_date, fallback to date_of_death)
   UPDATE SETTLEMENT
     SET DATE = COALESCE(DEADLINE_DATE, DATE_OF_DEATH)
     WHERE DATE IS NULL;

   -- Drop old columns
   ALTER TABLE SETTLEMENT
     DROP COLUMN IF EXISTS DEADLINE_DATE,
     DROP COLUMN IF EXISTS DATE_OF_DEATH;

   COMMIT;

   -- DOWN migration
   BEGIN;

   -- Recreate old columns
   ALTER TABLE SETTLEMENT
     ADD COLUMN IF NOT EXISTS DEADLINE_DATE TIMESTAMPTZ DEFAULT NULL,
     ADD COLUMN IF NOT EXISTS DATE_OF_DEATH TIMESTAMPTZ DEFAULT NULL;

   -- Migrate data back (NOTE: We lose information about which field was originally used)
   -- This is acceptable as rollback scenario - data is preserved
   UPDATE SETTLEMENT
     SET DEADLINE_DATE = DATE
     WHERE DATE IS NOT NULL;

   -- Drop new column
   ALTER TABLE SETTLEMENT
     DROP COLUMN IF EXISTS DATE;

   COMMIT;
   ```

3. **Test Migration**
   - Create test data with both `deadline_date` and `date_of_death` values
   - Run migration up
   - Verify data consolidation
   - Run migration down
   - Verify data restoration
   - Document any edge cases

**Dependencies:** None

**Deliverables:**

- ✅ Migration file created: `m-20260127-settlement-date-consolidation.js`
- ⏳ Migration tested locally
- ⏳ Data preservation verified
- ⏳ Rollback tested

**Status:** 🟡 In Progress

---

### Phase 2: Schema Updates (Zod) ⏸️ Not Started

**Goal:** Update Zod schemas in `@dmr.is/legal-gazette/schemas` to support new `date` field while maintaining backward compatibility for existing applications.

**Strategy:**

- Create new schemas with `date` field
- Keep legacy schemas with `deadline` and `dateOfDeath` for existing applications
- Update input schemas to accept both formats temporarily
- Phase out legacy schemas after all existing applications are updated/completed

**Files to Update:**

#### 1. `libs/legal-gazette/schemas/src/lib/recall/settlement.ts`

**Add new date field to base schemas:**

```typescript
// Update settlementSchema (permissive - for partial data)
export const settlementSchema = z.object({
  name: z.string().optional().nullable(),
  nationalId: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  liquidatorName: z.string().optional().nullable(),
  liquidatorLocation: z.string().optional().nullable(),
  recallRequirementStatementType: z.enum(ApplicationRequirementStatementEnum).optional().nullable(),
  recallRequirementStatementLocation: z.string().optional().nullable(),
  // NEW: Add date field
  date: z.string().optional().nullable(),
})

// settlementSchemaRefined stays the same (no date validation here)
```

#### 2. `libs/legal-gazette/schemas/src/lib/recall/bankruptcy.ts`

**Create new schema with `date`, keep legacy:**

```typescript
// NEW: Modern schema with single date field
export const recallBankruptcySchema = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchema.optional(),
  divisionMeetingFields: divisionMeetingSchema.optional(),
  settlementFields: settlementSchema
    .extend({
      date: z.string().optional().nullable(), // NEW
    })
    .optional(),
})

// LEGACY: Keep for backward compatibility (will be phased out)
export const recallBankruptcySchemaLegacy = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchema.optional(),
  divisionMeetingFields: divisionMeetingSchema.optional(),
  settlementFields: settlementSchema
    .extend({
      deadlineDate: z.string().optional().nullable(), // LEGACY
    })
    .optional(),
})

// NEW: Modern refined schema
export const recallBankruptcySchemaRefined = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchemaRefined,
  divisionMeetingFields: divisionMeetingSchemaRefined,
  settlementFields: settlementSchemaRefined.extend({
    date: z.iso.datetime('Dagsetning bús er nauðsynleg').refine((date) => isDateString(date), {
      message: 'Dagsetning bús er nauðsynleg',
    }),
  }),
})

// LEGACY: Keep for backward compatibility
export const recallBankruptcySchemaRefinedLegacy = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchemaRefined,
  divisionMeetingFields: divisionMeetingSchemaRefined,
  settlementFields: settlementSchemaRefined.extend({
    deadlineDate: z.iso.datetime('Frestdagur bús er nauðsynlegur').refine((date) => isDateString(date), {
      message: 'Frestdagur bús er nauðsynlegur',
    }),
  }),
})

// Export both versions
export const recallBankruptcyAnswers = baseApplicationSchema.extend({
  fields: recallBankruptcySchema.optional(),
})

export const recallBankruptcyAnswersLegacy = baseApplicationSchema.extend({
  fields: recallBankruptcySchemaLegacy.optional(),
})

export const recallBankruptcyAnswersRefined = baseApplicationSchemaRefined.extend({
  fields: recallBankruptcySchemaRefined,
  publishingDates: publishingDatesRecallSchemaRefined,
})

export const recallBankruptcyAnswersRefinedLegacy = baseApplicationSchemaRefined.extend({
  fields: recallBankruptcySchemaRefinedLegacy,
  publishingDates: publishingDatesRecallSchemaRefined,
})
```

#### 3. `libs/legal-gazette/schemas/src/lib/recall/deceased.ts`

**Create new schema with `date`, keep legacy:**

```typescript
// NEW: Modern schema with single date field
export const recallDeceasedSchema = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchema.optional(),
  divisionMeetingFields: divisionMeetingSchema.optional(),
  settlementFields: settlementSchema
    .extend({
      date: z.string().optional().nullable(), // NEW (used for dateOfDeath)
      type: z.enum(['DEFAULT', 'UNDIVIDED', 'OWNER']).optional(),
      companies: z.array(companySchema).optional(),
    })
    .optional(),
})

// LEGACY: Keep for backward compatibility
export const recallDeceasedSchemaLegacy = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchema.optional(),
  divisionMeetingFields: divisionMeetingSchema.optional(),
  settlementFields: settlementSchema
    .extend({
      dateOfDeath: z.string().optional().nullable(), // LEGACY
      type: z.enum(['DEFAULT', 'UNDIVIDED', 'OWNER']).optional(),
      companies: z.array(companySchema).optional(),
    })
    .optional(),
})

// NEW: Modern refined schema
export const recallDeceasedSchemaRefined = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchemaRefined,
  divisionMeetingFields: z
    .object({
      meetingDate: z.string().optional().nullable(),
      meetingLocation: z.string().optional().nullable(),
    })
    .optional(),
  settlementFields: settlementSchemaRefined
    .extend({
      date: z.iso.datetime('Dánardagur bús er nauðsynlegur').refine((date) => isDateString(date), {
        message: 'Dánardagur bús er nauðsynlegur',
      }),
      companies: z.array(companySchema).optional(),
      type: z.enum(['DEFAULT', 'UNDIVIDED', 'OWNER']).optional(),
    })
    .refine(
      (settlement) => {
        if (settlement.type === 'OWNER') {
          return settlement.companies && settlement.companies.length > 0
        }
        return true
      },
      {
        message: 'Aðeins fyrirtæki sem eigendur eru leyfðir',
        path: ['companies'],
      },
    ),
})

// Similar refine and legacy exports...
```

#### 4. `libs/legal-gazette/schemas/src/lib/inputs/update.ts`

**Create discriminated union to handle both schemas:**

```typescript
import * as z from 'zod'

### Phase 4: Service Layer Updates 🟡 In Progress

**Goal:** Update business logic to use new `date` field while handling legacy data transformation.
  recallBankruptcyApplicationSchemaLegacy,
  recallDeceasedApplicationSchema,
  recallDeceasedApplicationSchemaLegacy,
} from '../recall'

// Modern schema (prefer this)
export const updateApplicationInput = z
  .discriminatedUnion('type', [
    commonApplicationSchema,
    recallBankruptcyApplicationSchema,
    recallDeceasedApplicationSchema,
  ])
  .and(z.object({ currentStep: z.number().optional() }))

// Legacy schema (for existing applications)
export const updateApplicationInputLegacy = z
  .discriminatedUnion('type', [
    commonApplicationSchema,
    recallBankruptcyApplicationSchemaLegacy,
    recallDeceasedApplicationSchemaLegacy,
  ])
  .and(z.object({ currentStep: z.number().optional() }))

// Combined schema (accepts both)
export const updateApplicationInputCombined = z.union([
**Dependencies:** Phase 3 complete
  updateApplicationInputLegacy,
])

export const updateApplicationWithIdInput = z
  .object({
    id: z.uuid(),
  })
  .and(updateApplicationInputCombined) // Use combined schema
```

**Dependencies:** None (can be done in parallel with Phase 1)

**Testing:**

- ✅ Schema validation tests pass
- ✅ Both legacy and modern schemas accepted
- ✅ Type checking passes

**Status:** ✅ Complete

---

### Phase 3: Backend Model Updates ⏸️ Not Started

**Goal:** Update Sequelize model and TypeScript types to reflect new schema.

**Files to Modify:**

#### 1. `apps/legal-gazette-api/src/models/settlement.model.ts`

**Changes:**

a. **Update type definitions** (lines ~23-35)

```typescript
// OLD
type SettlementAttributes = {
  advertId: string
  type: SettlementType
  liquidatorName: string
  liquidatorLocation: string
  name: string
  nationalId: string
  address: string
  deadline: Date | null
  dateOfDeath: Date | null
  declaredClaims: number | null
  // ...
}

// NEW
type SettlementAttributes = {
  advertId: string
  type: SettlementType
  liquidatorName: string
  liquidatorLocation: string
  name: string
  nationalId: string
  address: string
  date: Date | null // ✅ Single date field
  declaredClaims: number | null
  // ...
}
```

b. **Update SettlementCreateAttributes** (lines ~37-44)

```typescript
// OLD
export type SettlementCreateAttributes = Omit<SettlementAttributes, 'advertId' | 'declaredClaims' | 'type'> & {
  advertId?: string
  declaredClaims?: number | null
  type?: SettlementType
}

// NEW (no change needed, but verify)
export type SettlementCreateAttributes = Omit<SettlementAttributes, 'advertId' | 'declaredClaims' | 'type'> & {
  advertId?: string
  declaredClaims?: number | null
  type?: SettlementType
}
```

c. **Update Sequelize column definitions** (lines ~110-125)

```typescript
// REMOVE
@Column({
  type: DataType.DATE,
  allowNull: true,
  defaultValue: null,
  field: 'deadline_date',
})
deadline!: Date | null

@Column({
  type: DataType.DATE,
  allowNull: true,
  defaultValue: null,
  field: 'date_of_death',
})
dateOfDeath!: Date | null

// ADD
@Column({
  type: DataType.DATE,
  allowNull: true,
  defaultValue: null,
  field: 'date',
})
date!: Date | null
```

d. **Update fromModel method** (lines ~136-155)

```typescript
// OLD
static fromModel(model: SettlementModel): SettlementDto {
  return {
    id: model.id,
    type: model.type,
    liquidatorName: model.liquidatorName,
    liquidatorLocation: model.liquidatorLocation,
    liquidatorRecallStatementLocation:
      model.liquidatorRecallStatementLocation,
    liquidatorRecallStatementType: model.liquidatorRecallStatementType,
    name: model.name,
    nationalId: model.nationalId,
    address: model.address,
    deadline: model.deadline ? model.deadline.toISOString() : null,
    dateOfDeath: model.dateOfDeath ? model.dateOfDeath.toISOString() : null,
    declaredClaims: model.declaredClaims,
  }
}

// NEW
static fromModel(model: SettlementModel): SettlementDto {
  return {
    id: model.id,
    type: model.type,
    liquidatorName: model.liquidatorName,
    liquidatorLocation: model.liquidatorLocation,
    liquidatorRecallStatementLocation:
      model.liquidatorRecallStatementLocation,
    liquidatorRecallStatementType: model.liquidatorRecallStatementType,
    name: model.name,
    nationalId: model.nationalId,
    address: model.address,
    date: model.date ? model.date.toISOString() : null,
    declaredClaims: model.declaredClaims,
  }
}
```

e. **Update SettlementDto** (lines ~171-240)

```typescript
// REMOVE
@ApiProperty({ type: String, required: false, nullable: true })
@ValidateIf((o) => o.deadline !== null)
@IsDateString()
deadline!: string | null

@ApiProperty({ type: String, required: false, nullable: true })
@ValidateIf((o) => o.dateOfDeath !== null)
@IsDateString()
dateOfDeath!: string | null

// ADD
@ApiProperty({ type: String, required: false, nullable: true })
@ValidateIf((o) => o.date !== null)
@IsDateString()
date!: string | null
```

f. **Update CreateSettlementDto** (lines ~242-305)

```typescript
// REMOVE
@ApiProperty({ type: String, required: false })
@IsOptional()
@IsDateString()
deadline?: string

@ApiProperty({ type: String, required: false })
@IsOptional()
@IsDateString()
dateOfDeath?: string

// ADD
@ApiProperty({ type: String, required: false })
@IsOptional()
@IsDateString()
date?: string
```

**Dependencies:** Phase 1 complete

**Testing:**

- ✅ Model unit tests updated and passing
- ✅ Type checking passes (`nx tsc legal-gazette-api`)
- ⏳ No TypeScript errors in dependent files

**Status:** 🟡 In Progress

---

### Phase 3: Service Layer Updates ⏸️ Not Started

**Goal:** Update business logic to use new `date` field.

**Files to Audit and Modify:**

1. **`apps/legal-gazette-api/src/core/settlements/settlement.service.ts`**

   - Search for: `deadline`, `dateOfDeath`
   - Replace with: `date`
   - Update any date-related business logic

2. **`apps/legal-gazette-api/src/modules/foreclosure/foreclosure.service.ts`**

   - Check settlement date references
   - Update any date calculations or validations

3. **`apps/legal-gazette-api/src/modules/applications/recall/recall-application.service.ts`**
   - **CRITICAL**: Add data transformation for legacy applications
   - When receiving legacy schema with `deadlineDate` or `dateOfDeath`, map to `date`
   - Keep backward compatibility during transition period

**Legacy Data Transformation Pattern:**

```typescript
// In recall-application.service.ts
private transformLegacySettlementData(data: any): any {
  if (!data?.settlementFields) return data

  const settlement = data.settlementFields
**Dependencies:** Phase 3 complete

**Testing:**
- ✅ Service unit tests updated and passing
- ✅ Integration tests updated
- ✅ Legacy data transformation works correctly
- ✅ No runtime errors

**Status:** ⏸️ Not Started

---

### Phase 5: Frontend Component Updates ⏸️ Not Started
  return data
}

// Use in update method
async updateApplication(id: string, data: UpdateApplicationInput) {
  const transformedData = this.transformLegacySettlementData(data)
  // ... rest of update logic
}
```

**Search Commands:**

```bash
# Find all references to deadline and dateOfDeath
nx run legal-gazette-api:grep-search -- -E "(deadline|dateOfDeath)" --include="*.ts"

# Or using ripgrep
rg "(deadline|dateOfDeath)" apps/legal-gazette-api/src --type ts
```

**Dependencies:** Phase 2 complete

**Testing:**

- ✅ Service unit tests updated and passing
- ✅ Integration tests updated
- ✅ No runtime errors

**Status:** ⏸️ Not Started

---

### Phase 4: Frontend Component Updates ⏸️ Not Started

**Goal:** Update React components to use new `date` field.

#### 4.1: Legal Gazette Web (Admin)

**Files to Update:**

1. **`apps/legal-gazette-web/src/components/field-set-items/SettlementFields.tsx`** ✅

   - Currently has conditional logic based on `settlementType`
   - Already shows only one date field at a time based on type
   - Update to use single `date` property

2. **Search for other references:**
   ```bash
   rg "(deadline|dateOfDeath)" apps/legal-gazette-web/src --type tsx
   ```

**Changes Required:**

```typescript
// OLD (SettlementFields.tsx)
const deadlineValue = settlement?.deadline
  ? parseISO(settlement.deadline)
  : null

const dateOfDeathValue = settlement?.dateOfDeath
  ? parseISO(settlement.dateOfDeath)
  : null

// Show deadline for DEFAULT type
{type === SettlementType.DEFAULT && (
  <DatePicker
    name="settlement.deadline"
    // ...
  />
)}

// Show dateOfDeath for UNDIVIDED/OWNER types
{(type === SettlementType.UNDIVIDED || type === SettlementType.OWNER) && (
  <DatePicker
    name="settlement.dateOfDeath"
    // ...
  />
)}

// NEW (SettlementFields.tsx)
const dateValue = settlement?.date
  ? parseISO(settlement.date)
  : null

// Single date field, label changes based on type
<DatePicker
  name="settlement.date"
  label={
    type === SettlementType.DEFAULT
      ? 'Eindagi'  // Deadline
      : 'Dánardagur'  // Date of Death
  }
  placeholder={
    type === SettlementType.DEFAULT
      ? 'Veldu eindaga'
      : 'Veldu dánardag'
**Dependencies:** Phase 4 complete, API changes deployed
  defaultValue={dateValue}
  onChange={(date) => {
    setValue('settlement.date', date?.toISOString() || '')
  }}
/>
```

#### 4.2: Legal Gazette Application Web

**Files to Search:**

```bash
### Phase 6: Testing & Validation ⏸️ Not Startedpplication-web/src --type tsx
```

**Update Strategy:**

- Similar to admin web, update form fields
- Update tRPC client type expectations
- Test application submission flow

#### 4.3: Legal Gazette Public Web

**Files to Search:**

```bash
rg "(deadline|dateOfDeath)" apps/legal-gazette-public-web/src --type tsx
```

**Update Strategy:**

- Update display components
- Verify settlement detail pages
- Test public-facing settlement views

**Dependencies:** Phase 3 complete, API changes deployed

**Testing:**

- ✅ Frontend builds successfully
- ✅ Form submission works with new field
- ✅ Display components show correct date
- ✅ Type checking passes for all apps

**Status:** ⏸️ Not Started

---

### Phase 5: Testing & Validation ⏸️ Not Started

**Goal:** Comprehensive testing across all layers.

#### 5.1: Backend Tests

**Unit Tests:**

1. **`settlement.model.spec.ts`**

   ```typescript
   describe('SettlementModel', () => {
     it('should create settlement with date field', () => {
       const settlement = SettlementModel.build({
         type: SettlementType.DEFAULT,
         name: 'Test Settlement',
         nationalId: '1234567890',
         address: 'Test Address',
         liquidatorName: 'John Doe',
         liquidatorLocation: 'Reykjavik',
         date: new Date('2026-03-01'),
       })

       expect(settlement.date).toBeDefined()
       expect(settlement).not.toHaveProperty('deadline')
       expect(settlement).not.toHaveProperty('dateOfDeath')
     })

     it('should serialize date to ISO string in DTO', () => {
       const settlement = SettlementModel.build({
         // ...
         date: new Date('2026-03-01T00:00:00Z'),
       })

       const dto = settlement.fromModel()
       expect(dto.date).toBe('2026-03-01T00:00:00.000Z')
     })
   })
   ```

2. **`settlement.service.spec.ts`**

   - Update all test fixtures
   - Verify create/update operations use `date` field
   - Test date validations

3. **`foreclosure.service.spec.ts`**
   - Update settlement-related test data
   - Verify date calculations still work

**Integration Tests:**

1. **API Endpoint Tests**

   ```typescript
   describe('POST /settlements', () => {
     it('should create settlement with date field', async () => {
       const response = await request(app.getHttpServer()).post('/api/v1/settlements').send({
         type: 'DEFAULT',
         name: 'Test Settlement',
         nationalId: '1234567890',
         address: 'Test Address',
         liquidatorName: 'John Doe',
         liquidatorLocation: 'Reykjavik',
         date: '2026-03-01T00:00:00Z',
       })

       expect(response.status).toBe(201)
       expect(response.body.date).toBe('2026-03-01T00:00:00.000Z')
       expect(response.body).not.toHaveProperty('deadline')
       expect(response.body).not.toHaveProperty('dateOfDeath')
     })
   })
   ```

#### 5.2: Frontend Tests

**Component Tests:**

1. **`SettlementFields.spec.tsx`**

   ```typescript
   describe('SettlementFields', () => {
     it('should render single date field for DEFAULT type', () => {
       const settlement = {
         type: SettlementType.DEFAULT,
         date: '2026-03-01T00:00:00Z',
       }

       render(<SettlementFields settlement={settlement} />)

       expect(screen.getByLabelText('Eindagi')).toBeInTheDocument()
       expect(screen.queryByLabelText('Dánardagur')).not.toBeInTheDocument()
     })

     it('should render date field with correct label for UNDIVIDED type', () => {
       const settlement = {
         type: SettlementType.UNDIVIDED,
         date: '2026-03-01T00:00:00Z',
       }

       render(<SettlementFields settlement={settlement} />)

       expect(screen.getByLabelText('Dánardagur')).toBeInTheDocument()
       expect(screen.queryByLabelText('Eindagi')).not.toBeInTheDocument()
     })
   })
   ```

   **Dependencies:** Phases 1-5 complete
   **E2E Tests:**

1. Test complete settlement creation flow
1. Test settlement editing
1. Test public settlement viewing

#### 5.3: Data Validation

**Manual Testing Checklist:**

- [ ] Create new settlement with date field via API
- [ ] Create new settlement via admin web UI

### Phase 7: Documentation & Deployment ⏸️ Not Started

- [ ] View settlement on public web
- [ ] Submit application with settlement
- [ ] Verify published adverts show correct date
- [ ] Test with all settlement types (DEFAULT, UNDIVIDED, OWNER)

**Data Migration Validation:**

```sql
-- Check for data loss after migration
SELECT
  COUNT(*) as total_settlements,
  COUNT(date) as settlements_with_date,
  COUNT(*) - COUNT(date) as settlements_without_date
FROM SETTLEMENT;

-- Should return 0 settlements_without_date if migration was successful
```

**Dependencies:** Phases 1-4 complete

**Testing:**

- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ E2E tests pass
- ✅ Manual testing complete
- ✅ Data validated in database

**Status:** ⏸️ Not Started

---

### Phase 6: Documentation & Deployment ⏸️ Not Started

**Goal:** Document changes and deploy safely.

#### 6.1: Code Documentation

**Update/Create Documentation:**

1. **API Documentation (Swagger)**

   - Automatically updated via `SettlementDto` decorators
   - Verify swagger UI shows new `date` field
   - Remove references to old `deadline` and `dateOfDeath` fields

2. **Type Definitions**

   - Already handled in Phase 2
   - Ensure exported types are correct

3. **README Updates**
   - Document breaking change in API changelog
   - Add migration notes if needed

#### 6.2: Breaking Change Communication

**API Breaking Change Notice:**

````markdown
## Breaking Change: Settlement Date Consolidation

**Effective Date:** [Deployment Date]

### What Changed

The Settlement model has been simplified:

- **Removed:** `deadline` field
- **Removed:** `dateOfDeath` field
- **Added:** `date` field (consolidates both previous fields)

### Migration Guide

**Before:**

```json
{
  "type": "DEFAULT",
  "deadline": "2026-03-01T00:00:00Z",
  "dateOfDeath": null
}
```
````

**After:**

```json
{
  "type": "DEFAULT",
  "date": "2026-03-01T00:00:00Z"
}
```

### Client Action Required

If you consume the Settlement API:

1. Update your code to use `date` instead of `deadline` or `dateOfDeath`
2. Update TypeScript types if using generated clients
3. Test your integration before [Deployment Date]

### Backward Compatibility

None. This is a breaking change. All clients must update.

````

#### 6.3: Deployment Plan

**Pre-Deployment:**

1. ✅ All tests passing
2. ✅ Code review complete
3. ✅ Staging environment tested
4. ✅ Breaking change communicated
5. ✅ Rollback plan ready

**Deployment Steps:**

1. **Backend Deployment:**
   ```bash
   # Deploy API with migration
   nx build legal-gazette-api
   # Run migration on production database
   nx run legal-gazette-api:migrate
   # Deploy new API version
   [deployment commands]
````

2. **Frontend Deployment:**

   ```bash
   # Deploy all frontends
   nx build legal-gazette-web
   nx build legal-gazette-application-web
   nx build legal-gazette-public-web
   [deployment commands]
   ```

3. **Monitoring:**
   - Watch error logs for date-related issues
   - Monitor API endpoints for 400/500 errors
   - Check frontend Sentry for client errors
   - Validate data in production database

**Rollback Plan:**

If issues arise:

```bash
# Rollback migration
nx run legal-gazette-api:migrate/undo

# Rollback API deployment
[rollback commands]

# Rollback frontend deployments
[rollback commands]
```

**Dependencies:** Phase 6 complete, stakeholders notified
**Dependencies:** Phase 5 complete, stakeholders notified

**Status:** ⏸️ Not Started

---

## Testing Checklist

### Backend

- [ ] Model unit tests updated and passing
- [ ] Service unit tests updated and passing
- [ ] Controller tests updated and passing
- [ ] Integration tests updated and passing
- [ ] Migration tested (up and down)
- [ ] Data preservation verified
- [ ] API documentation (Swagger) verified

### Frontend

- [ ] Component tests updated and passing
- [ ] Form submission works with new field
- [ ] Display components render correctly
- [ ] Type checking passes
- [ ] Build succeeds for all apps

### E2E

- [ ] Create settlement flow works
- [ ] Edit settlement flow works
- [ ] View settlement (admin) works
- [ ] View settlement (public) works
- [ ] Application submission with settlement works
- [ ] Published adverts show correct date

### Data

- [ ] Migration preserves all existing dates
- [ ] No data loss detected
- [ ] All settlements have valid dates where expected
- [ ] Staging environment validated

---

## Risks & Mitigations

| Risk                                 | Impact | Probability | Mitigation                                     |
| ------------------------------------ | ------ | ----------- | ---------------------------------------------- |
| Data loss during migration           | High   | Low         | Thorough testing, backup before migration      |
| Frontend breaks due to missing field | High   | Medium      | Update all frontends before deploying API      |
| Existing applications fail           | High   | Medium      | Legacy schema support with data transformation |
| Migration takes too long             | Medium | Low         | Test on staging with production-size data      |
| Rollback loses new data              | Medium | Low         | Document rollback limitations, careful timing  |

---

## Success Criteria

- ✅ Migration completes successfully with no data loss
- ✅ All backend tests pass
- ✅ All frontend tests pass
- ✅ API documentation reflects new schema
- ✅ Staging environment fully tested
- ✅ Zero production errors related to settlement dates
- ✅ All frontends handle new `date` field correctly

---

## Timeline Estimate

| Phase                                     | Effort  | Dependencies | Target Date      |
| ----------------------------------------- | ------- | ------------ | ---------------- | ------ | ------------ |
| Phase 1: Database Migration               | 3h      | None         | Jan 27, 2026     |
| Phase 2: Schema Updates (Zod)             | 3h      | None         | Jan 27, 2026     |
| Phase 3: Backend Model                    | 2h      | Phase 1      | Jan 27, 2026     |
| Phase 4: Service Layer + Legacy Transform | 3h      | Phase 2, 3   | Jan 28, 2026     |
| Phase 5: Frontend Components              | 4h      | Phase 4      | Jan 29, 2026     |
| Phase 6: Testing & Validation             | 4h      | Phase 5      | Jan 30, 2026     |
| Phase 7: Documentation & Deployment       | 2h      | Phase 6      | Jan 31, 2026     |
| **Total**                                 | **21h** | -            | **Jan 31, 2026** | hase 5 | Jan 31, 2026 |
| **Total**                                 | **17h** | -            | **Jan 31, 2026** |

**Buffer:** 2 days for unexpected issues  
**Final Target:** February 3, 2026

---

## Open Questions

1. **Q:** Should the migration prefer `deadline_date` or `date_of_death` when both are present?
   **A:** ✅ Prefer `deadline_date` (use `COALESCE(deadline_date, date_of_death)`)
2. **Q:** Are there any external clients consuming the Settlement API?
   **A:** ✅ No external clients
3. **Q:** Should we maintain API versioning to support old clients?
   **A:** ✅ No API versioning needed, but must support legacy schemas for existing applications
4. **Q:** What is the staging/production data volume for settlements?
   **A:** ✅ ~100 applications (low volume, migration will be fast)

---

## Related Issues

- **Current Branch:** `fix/deadline-and-dateof-death`
- **Related Files:**
  - `apps/legal-gazette-api/src/models/settlement.model.ts`
  - `apps/legal-gazette-web/src/components/field-set-items/SettlementFields.tsx`
  - Migration files in `apps/legal-gazette-api/db/migrations/`

---

## Notes

- **No external clients**, so breaking changes are internal only
- **Legacy schema support** ensures existing ~100 applications continue to work during transition
- The frontend already conditionally shows only one date field at a time based on `settlementType`, so the UX impact is minimal
- The migration is **reversible** but with caveats (cannot distinguish which original field was used)
- Legacy schemas can be **phased out** once all existing applications are completed/updated (track via application status)o the UX impact is minimal
- The migration is **reversible** but with caveats (cannot distinguish which original field was used)

---

## Status Legend

- 🔵 **Planning** - Not yet started
- 🟡 **In Progress** - Work underway
- ✅ **Complete** - Finished and tested
- ⏸️ **Not Started** - Waiting on dependencies
- ⏹️ **Blocked** - Cannot proceed

---

**Last Updated:** January 27, 2026  
**Next Review:** After Phase 1 completion
