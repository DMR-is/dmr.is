# Plan: Legacy Subscriber Data Import

> **⚠️ STATUS: OBSOLETE**
> 
> **Date Deprecated:** December 16, 2024
> 
> This plan has been superseded. The legacy migration approach (importing data to LEGACY_SUBSCRIBERS table, magic link migration flow) has been **abandoned** in favor of a simpler direct subscriber management approach.
> 
> **What happened:**
> - The `legacy_subscribers` and `legacy_migration_tokens` tables have been dropped
> - The entire `modules/legacy-migration/` module has been deleted
> - The subscriber table now has a simplified schema with direct data entry
> 
> **New approach:**
> - Subscribers are created directly in the `legal_gazette_subscribers` table
> - No migration flow needed - admin users can import/create subscribers directly
> - Schema now includes: `national_id`, `name`, `email`, `is_active`, `subscribed_from`, `subscribed_to`
> 
> See the current subscriber model at: `apps/legal-gazette-api/src/models/subscriber.model.ts`

---

## ~~Summary~~ (Historical)

~~Import legacy subscriber data from the old Legal Gazette system into the new `LEGACY_SUBSCRIBERS` table. This data is required for the legacy migration flow to work.~~

## Planning Date

December 3, 2025

---

## ~~Background~~ (Historical)

### ~~Source System~~

~~The legacy Legal Gazette system uses email+password authentication with the following user data:~~
- ~~**Name** - User's full name~~
- ~~**Email** - Login identifier (unique)~~
- ~~**Kennitala** - Optional national ID~~
- ~~**isActive** - Subscription status~~
- ~~**subscribedAt** - Original subscription date (IMPORTANT: Required for subscription tracking)~~
- ~~**Password Hash** - Hashed password (algorithm TBD)~~

### ~~Target Table~~ (DROPPED)

~~This table has been dropped as of December 16, 2024.~~

```sql
-- DROPPED: This table no longer exists
CREATE TABLE LEGACY_SUBSCRIBERS (
  ID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  CREATED_AT TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  DELETED_AT TIMESTAMPTZ,

  NAME TEXT NOT NULL,
  EMAIL TEXT NOT NULL UNIQUE,
  NATIONAL_ID TEXT,  -- Nullable
  IS_ACTIVE BOOLEAN NOT NULL DEFAULT FALSE,
  SUBSCRIBED_AT TIMESTAMPTZ,  -- Original subscription date from legacy system
  PASSWORD_HASH TEXT,

  MIGRATED_AT TIMESTAMPTZ,
  MIGRATED_TO_SUBSCRIBER_ID UUID REFERENCES LEGAL_GAZETTE_SUBSCRIBERS(ID)
);
```

---

## ~~Implementation Plan~~ (Historical)

### ~~Phase 1: Data Export from Legacy System~~

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
| subscribedAt | timestamp | **Yes** | **Original subscription date - CRITICAL for preserving subscription history** |
| passwordHash | string | No | For potential future use |

**IMPORTANT:** The `subscribedAt` field is critical for preserving the original subscription dates from the legacy system. When legacy users migrate to the new system, this date will be transferred to their new subscriber record to maintain accurate subscription history.

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
  subscribedAt: Date  // REQUIRED: Original subscription date
  passwordHash?: string | null
}

async function importLegacySubscribers(data: LegacySubscriberImport[]): Promise<void> {
  // 1. Validate data format
  // 2. Check for duplicate emails
  // 3. Normalize data (trim whitespace, lowercase emails)
  // 4. Validate and parse subscribedAt dates
  // 5. Insert into LEGACY_SUBSCRIBERS table
  // 6. Log results (success count, error count, duplicates skipped)
}
```

#### 2.3 Validation Rules

- Email must be valid format and unique
- Name must not be empty
- **subscribedAt must be a valid timestamp** (critical field)
- subscribedAt should not be in the future
- For active subscribers, subscribedAt should not be null
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
- [ ] Verify subscribedAt dates are preserved correctly
- [ ] Test with missing subscribedAt (should fail validation for active users)
- [ ] Test with invalid date formats

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
- [ ] **Verify all active subscribers have valid subscribedAt dates**
- [ ] Verify subscribedAt date range is reasonable (e.g., not in future, not before system launch)
- [ ] Verify no data corruption

---

## Open Questions

1. **Export Format:** What format will the legacy data be exported in? (CSV, JSON, SQL dump)

2. **Password Hash Algorithm:** What hashing algorithm does the legacy system use? (bcrypt, argon2, etc.)

3. **Data Timing:** When will the export be taken? Do we need to handle incremental imports?

4. **Data Quality:** Are there known data quality issues to handle? (missing names, invalid emails, etc.)

5. **Historical Data:** Should we import any additional historical data beyond basic subscriber info?

6. **subscribedAt Data Quality:** Are subscription dates available for all legacy users? What should we use as fallback if missing?

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

- Legacy system data export must be provided **including subscribedAt dates**
- Database migration `m-20251202-legacy-subscribers.js` must be run first
- Database migration `m-20251203-legacy-subscriber-subscribed-at.js` must be run first
- [Legacy Subscriber Migration](./plan-legacy-subscriber-migration.md) plan provides context

---

## Related Plans

- [Legacy Subscriber Migration](./plan-legacy-subscriber-migration.md) - Migration flow that uses this imported data
- [TBR Subscription Payment](./plan-tbr-subscription-payment.md) - Payment for new (non-legacy) subscribers
