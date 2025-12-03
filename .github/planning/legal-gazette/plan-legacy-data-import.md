# Plan: Legacy Subscriber Data Import

## Summary

Import legacy subscriber data from the old Legal Gazette system into the new `LEGACY_SUBSCRIBERS` table. This data is required for the legacy migration flow to work.

## Planning Date

December 3, 2025

---

## Background

### Source System

The legacy Legal Gazette system uses email+password authentication with the following user data:
- **Name** - User's full name
- **Email** - Login identifier (unique)
- **Kennitala** - Optional national ID
- **isActive** - Subscription status
- **Password Hash** - Hashed password (algorithm TBD)

### Target Table

```sql
CREATE TABLE LEGACY_SUBSCRIBERS (
  ID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  CREATED_AT TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  DELETED_AT TIMESTAMPTZ,
  
  NAME TEXT NOT NULL,
  EMAIL TEXT NOT NULL UNIQUE,
  NATIONAL_ID TEXT,  -- Nullable
  IS_ACTIVE BOOLEAN NOT NULL DEFAULT FALSE,
  PASSWORD_HASH TEXT,
  
  MIGRATED_AT TIMESTAMPTZ,
  MIGRATED_TO_SUBSCRIBER_ID UUID REFERENCES LEGAL_GAZETTE_SUBSCRIBERS(ID)
);
```

---

## Implementation Plan

### Phase 1: Data Export from Legacy System

#### 1.1 Obtain Data Export

- [ ] Coordinate with legacy system administrators
- [ ] Request data export in agreed format (CSV, JSON, or SQL dump)
- [ ] Verify export includes all required fields

#### 1.2 Data Format

Expected fields:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | Yes | Full name |
| email | string | Yes | Unique identifier |
| nationalId | string | No | Kennitala (may be null) |
| isActive | boolean | Yes | Subscription status |
| passwordHash | string | No | For potential future use |

---

### Phase 2: Create Import Script

#### 2.1 Script Location

**File:** `apps/legal-gazette-api/scripts/import-legacy-subscribers.ts`

Or as a Sequelize seeder:
**File:** `apps/legal-gazette-api/db/seeders/legacy-subscribers-import.js`

#### 2.2 Script Requirements

```typescript
interface LegacySubscriberImport {
  name: string
  email: string
  nationalId?: string | null
  isActive: boolean
  passwordHash?: string | null
}

async function importLegacySubscribers(data: LegacySubscriberImport[]): Promise<void> {
  // 1. Validate data format
  // 2. Check for duplicate emails
  // 3. Normalize data (trim whitespace, lowercase emails)
  // 4. Insert into LEGACY_SUBSCRIBERS table
  // 5. Log results (success count, error count, duplicates skipped)
}
```

#### 2.3 Validation Rules

- Email must be valid format and unique
- Name must not be empty
- National ID (if present) should be valid Icelandic kennitala format
- Handle duplicates gracefully (skip or update)

#### 2.4 Error Handling

- Log validation errors with row number/identifier
- Continue processing on non-fatal errors
- Generate summary report at end

---

### Phase 3: Testing

#### 3.1 Test Data

- [ ] Create sample test data file with edge cases
- [ ] Include records with/without kennitala
- [ ] Include active and inactive subscriptions
- [ ] Include edge cases (special characters in names, etc.)

#### 3.2 Test Scenarios

- [ ] Import fresh (empty table)
- [ ] Import with existing data (handle duplicates)
- [ ] Validation error handling
- [ ] Large dataset performance

---

### Phase 4: Production Import

#### 4.1 Pre-Import Checklist

- [ ] Backup database before import
- [ ] Verify migration `m-20251202-legacy-subscribers.js` has been run
- [ ] Verify data export is complete and accurate
- [ ] Test import script in staging environment

#### 4.2 Import Execution

- [ ] Run import script against production database
- [ ] Verify record counts match expected
- [ ] Spot-check random records for accuracy

#### 4.3 Post-Import Verification

- [ ] Count total imported records
- [ ] Count records with kennitala (eligible for auto-migration)
- [ ] Count records without kennitala (require magic link)
- [ ] Verify no data corruption

---

## Open Questions

1. **Export Format:** What format will the legacy data be exported in? (CSV, JSON, SQL dump)

2. **Password Hash Algorithm:** What hashing algorithm does the legacy system use? (bcrypt, argon2, etc.)

3. **Data Timing:** When will the export be taken? Do we need to handle incremental imports?

4. **Data Quality:** Are there known data quality issues to handle? (missing names, invalid emails, etc.)

5. **Historical Data:** Should we import any additional historical data beyond basic subscriber info?

---

## File Summary

### Files to Create

| File | Type | Description | Status |
|------|------|-------------|--------|
| `scripts/import-legacy-subscribers.ts` | Script | Import script | 🔲 Not Started |
| `scripts/test-data/legacy-subscribers-sample.json` | Test Data | Sample import data | 🔲 Not Started |

---

## Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Data Export | 🔲 Not Started | Waiting for legacy system export |
| Phase 2: Import Script | 🔲 Not Started | |
| Phase 3: Testing | 🔲 Not Started | |
| Phase 4: Production Import | 🔲 Not Started | |

---

## Dependencies

- Legacy system data export must be provided
- Database migration `m-20251202-legacy-subscribers.js` must be run first
- [Legacy Subscriber Migration](./plan-legacy-subscriber-migration.md) plan provides context

---

## Related Plans

- [Legacy Subscriber Migration](./plan-legacy-subscriber-migration.md) - Migration flow that uses this imported data
- [TBR Subscription Payment](./plan-tbr-subscription-payment.md) - Payment for new (non-legacy) subscribers
