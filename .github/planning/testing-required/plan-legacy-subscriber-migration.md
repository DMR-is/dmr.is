# Plan: Legacy Subscriber Migration to New System

## Summary

Migrate legacy users (email+password authentication) to the new Kennitala-based authentication system. Users with existing subscriptions can redeem their accounts via a magic link flow.

## Planning Date

December 2, 2025

## Completion Date

December 3, 2025

---

## Background

### Current Legacy System (External)

The legacy system uses email+password authentication with the following user data:
- **Name** - User's full name
- **Email** - Login identifier
- **Kennitala** - Optional (this becomes the new auth identifier)
- **isActive** - Subscription status

### New System

Uses Island.is authentication (Kennitala-based) via NextAuth with IdentityServer4. Users are stored in `LEGAL_GAZETTE_SUBSCRIBERS` table.

**Key Files:**
- [`apps/legal-gazette-api/src/models/subscriber.model.ts`](../../../apps/legal-gazette-api/src/models/subscriber.model.ts) - Current subscriber model
- [`apps/legal-gazette-public-web/src/lib/authOptions.ts`](../../../apps/legal-gazette-public-web/src/lib/authOptions.ts) - NextAuth configuration
- [`apps/legal-gazette-public-web/src/app/skraning/@register/page.tsx`](../../../apps/legal-gazette-public-web/src/app/skraning/@register/page.tsx) - Registration UI

---

## Migration Scenarios

### Scenario 1: Legacy User WITH Kennitala

**Flow:** Automatic migration on first sign-in
- User authenticates via Island.is
- System checks `LEGACY_SUBSCRIBERS` table by kennitala
- If found with active subscription → auto-create `SubscriberModel` with `isActive: true`
- Mark legacy record as migrated

### Scenario 2: Legacy User WITHOUT Kennitala (Magic Link Flow)

**Flow:** Manual redemption via magic link
1. User authenticates via Island.is (gets session with nationalId)
2. User sees "Redeem existing account" option
3. User enters legacy email address
4. System validates email exists in `LEGACY_SUBSCRIBERS`
5. System generates magic link token (contains nationalId + email mapping)
6. Email sent to legacy email address
7. User clicks magic link → redirected to app
8. User must re-authenticate via Island.is
9. If authenticated nationalId matches token's nationalId → migrate subscriber
10. Mark legacy record as migrated

### Scenario 3: New User (No Legacy Account)

**Flow:** New registration
1. User authenticates via Island.is
2. No existing subscriber or legacy match found
3. User fills registration form
4. System creates `SubscriberModel` with `isActive: false`
5. Payment integration handled separately (see [TBR Subscription Payment Plan](./plan-tbr-subscription-payment.md))

---

## Implementation Steps

### Phase 1: Database Schema

#### 1.1 Create Migration File

**File:** `apps/legal-gazette-api/db/migrations/m-YYYYMMDD-legacy-subscribers.js`

```sql
BEGIN;

-- Table for imported legacy user data
CREATE TABLE LEGACY_SUBSCRIBERS (
  ID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  CREATED_AT TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  DELETED_AT TIMESTAMPTZ,
  
  NAME TEXT NOT NULL,
  EMAIL TEXT NOT NULL UNIQUE,
  NATIONAL_ID TEXT,  -- Nullable, may not have kennitala
  IS_ACTIVE BOOLEAN NOT NULL DEFAULT FALSE,
  PASSWORD_HASH TEXT,  -- For potential future password verification
  
  -- Migration tracking
  MIGRATED_AT TIMESTAMPTZ,
  MIGRATED_TO_SUBSCRIBER_ID UUID REFERENCES LEGAL_GAZETTE_SUBSCRIBERS(ID)
);

-- Table for magic link tokens
CREATE TABLE LEGACY_MIGRATION_TOKENS (
  ID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  CREATED_AT TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  TOKEN TEXT NOT NULL UNIQUE,
  EMAIL TEXT NOT NULL,
  TARGET_NATIONAL_ID TEXT NOT NULL,  -- The kennitala requesting migration
  EXPIRES_AT TIMESTAMPTZ NOT NULL,
  USED_AT TIMESTAMPTZ,  -- NULL until used, single-use enforcement
  
  LEGACY_SUBSCRIBER_ID UUID NOT NULL REFERENCES LEGACY_SUBSCRIBERS(ID)
);

CREATE INDEX idx_legacy_subscribers_email ON LEGACY_SUBSCRIBERS(EMAIL);
CREATE INDEX idx_legacy_subscribers_national_id ON LEGACY_SUBSCRIBERS(NATIONAL_ID);
CREATE INDEX idx_legacy_migration_tokens_token ON LEGACY_MIGRATION_TOKENS(TOKEN);

-- Add reference to track migration source on subscriber
ALTER TABLE LEGAL_GAZETTE_SUBSCRIBERS 
ADD COLUMN LEGACY_SUBSCRIBER_ID UUID REFERENCES LEGACY_SUBSCRIBERS(ID);

COMMIT;
```

#### 1.2 Create Sequelize Models

**File:** `apps/legal-gazette-api/src/models/legacy-subscriber.model.ts`

- `LegacySubscriberModel` - Maps to `LEGACY_SUBSCRIBERS` table
- Fields: id, name, email, nationalId (nullable), isActive, passwordHash, migratedAt, migratedToSubscriberId

**File:** `apps/legal-gazette-api/src/models/legacy-migration-token.model.ts`

- `LegacyMigrationTokenModel` - Maps to `LEGACY_MIGRATION_TOKENS` table
- Fields: id, token, email, targetNationalId, expiresAt, usedAt, legacySubscriberId

---

### Phase 2: Backend Services

#### 2.1 Create Legacy Migration Module

**Directory:** `apps/legal-gazette-api/src/modules/legacy-migration/`

**Files to create:**
- `legacy-migration.provider.module.ts` - Service providers
- `legacy-migration.controller.module.ts` - Controller module
- `legacy-migration.controller.ts` - API endpoints
- `legacy-migration.service.ts` - Business logic
- `legacy-migration.service.interface.ts` - Interface definition

#### 2.2 Service Methods

```typescript
interface ILegacyMigrationService {
  // Check if email exists in legacy system
  checkLegacyEmail(email: string): Promise<{ exists: boolean; hasKennitala: boolean }>
  
  // Request magic link for migration
  requestMigration(email: string, targetNationalId: string): Promise<void>
  
  // Complete migration after magic link verification
  completeMigration(token: string, authenticatedNationalId: string): Promise<SubscriberDto>
  
  // Auto-migrate users with kennitala on sign-in
  autoMigrateByKennitala(nationalId: string): Promise<SubscriberDto | null>
}
```

#### 2.3 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/v1/legacy-migration/check-email` | PublicWebScopes | Check if email exists in legacy system |
| `POST` | `/v1/legacy-migration/request` | PublicWebScopes | Send magic link to legacy email |
| `POST` | `/v1/legacy-migration/complete` | PublicWebScopes | Complete migration with token verification |

#### 2.4 Magic Link Token Security

- **Token Format:** UUID v4 or cryptographically secure random string
- **Expiry:** 24 hours from creation
- **Single-use:** Mark `usedAt` timestamp on redemption
- **Verification:** 
  1. Token must exist and not be expired
  2. Token must not have been used (`usedAt IS NULL`)
  3. Authenticated user's nationalId must match token's `targetNationalId`

---

### Phase 3: Email Integration

#### 3.1 Email Template

Use existing [`AWSService.sendMail()`](../../../libs/shared/modules/src/aws/aws.service.ts) for sending magic links.

**Email Content:**
```
Subject: Staðfesting á flutningi áskriftar - Lögbirtingablaðið

Sæl/l,

Þú hefur óskað eftir að flytja áskriftina þína á Lögbirtingablaðinu yfir í nýja kerfið.

Smelltu á eftirfarandi hlekk til að ljúka flutningnum:
[Magic Link URL]

Hlekkurinn er virkur í 24 klukkustundir.

Ef þú baðst ekki um þennan flutning, vinsamlegast hunsaðu þennan tölvupóst.

Kveðja,
Lögbirtingablaðið
```

#### 3.2 Magic Link URL Structure

```
https://logbirtingablad.is/skraning/flytja?token={TOKEN}
```

---

### Phase 4: Frontend Updates

#### 4.1 Update Registration Page

**File:** `apps/legal-gazette-public-web/src/app/skraning/@register/page.tsx`

Add two sections:
1. **"Flytja eldri áskrift"** (Redeem existing account)
   - Email input field
   - "Senda staðfestingarpóst" button
   - Success/error feedback
   
2. **"Ný áskrift"** (New subscription) - existing form

#### 4.2 Create Migration Completion Page

**File:** `apps/legal-gazette-public-web/src/app/skraning/flytja/page.tsx`

- Reads `token` from URL query params
- Shows loading state while verifying
- Calls `/v1/legacy-migration/complete` with token
- On success → redirect to home with success message
- On error → show error and suggest retry or contact support

#### 4.3 Add tRPC Routes

**File:** `apps/legal-gazette-public-web/src/lib/trpc/server/routers/legacyMigrationRouter.ts`

```typescript
export const legacyMigrationRouter = router({
  checkEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.checkLegacyEmail(input)
    }),
    
  requestMigration: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.requestMigration(input)
    }),
    
  completeMigration: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.completeMigration(input)
    }),
})
```

---

### Phase 5: Auto-Migration on Sign-In

#### 5.1 Update Subscriber Service

Modify [`SubscriberService.getUserByNationalId()`](../../../apps/legal-gazette-api/src/modules/subscribers/subscriber.service.ts):

```typescript
async getUserByNationalId(user: DMRUser): Promise<SubscriberDto> {
  // 1. Check existing subscriber
  const subscriber = await this.subscriberModel.findOne({
    where: { nationalId: user.nationalId },
  })
  
  if (subscriber) {
    return subscriber.fromModel()
  }
  
  // 2. Check for auto-migratable legacy user (has kennitala)
  const legacyUser = await this.legacyMigrationService.autoMigrateByKennitala(user.nationalId)
  if (legacyUser) {
    return legacyUser
  }
  
  // 3. Create new inactive subscriber
  const newSubscriber = await this.createSubscriber(user)
  return newSubscriber
}
```

---

## Security Considerations

### Magic Link Security

| Risk | Mitigation |
|------|------------|
| Token guessing | Use cryptographically secure random tokens (UUID v4 or 32+ bytes) |
| Token replay | Single-use tokens with `usedAt` tracking |
| Token expiry | 24-hour expiration enforced at validation |
| Wrong user claiming | Re-authentication required; nationalId must match token's target |
| Email interception | Standard email security; token alone is not sufficient |

### Authorization

- All endpoints require `@PublicWebScopes()` (authenticated via Island.is)
- Magic link completion verifies authenticated user matches token target
- Legacy data access is read-only for migration purposes

---

## Data Migration Script

A separate data import script will be needed to populate `LEGACY_SUBSCRIBERS` from the old system.

**Script Requirements:**
- Parse export from legacy database
- Insert into `LEGACY_SUBSCRIBERS` table
- Validate email uniqueness
- Handle duplicates gracefully

**Note:** Check if legacy system can export password hashes. If available and compatible (e.g., bcrypt), could enable password verification as alternative flow in future.

---

## Testing Checklist

- [ ] Legacy email check returns correct exists/hasKennitala status
- [ ] Magic link email is sent successfully
- [ ] Token expires after 24 hours
- [ ] Token cannot be reused after redemption
- [ ] Migration fails if authenticated nationalId doesn't match token
- [ ] Successful migration creates subscriber with correct isActive status
- [ ] Auto-migration works for legacy users with kennitala
- [ ] New user registration creates subscriber with isActive: false

---

## Open Questions

1. **Password Hash Compatibility:** Can we obtain password hashes from legacy system? If so, what hashing algorithm was used? This could enable an alternative email+password verification flow.

2. **Subscription Expiry:** Do legacy subscriptions have expiry dates that should be carried over?

3. **Historical Data:** Should we preserve any historical data from legacy accounts (e.g., previous payments)?

4. **Admin Tools:** Do we need admin endpoints to manually migrate users or view migration status?

---

## TODOs / Known Issues

1. **⚠️ Email Service Error Handling:** The `requestMigration` method in `legacy-migration.service.ts` currently does not throw an error if `IAWSService.sendMail()` fails to send the email. This results in a false success response to the user. Need to check the return value of `sendMail()` and throw an error if the email was not sent successfully.

2. **🧪 Manual Testing Required:** Before release, perform manual testing of all user flows:
   - [ ] New user registration (no legacy account)
   - [ ] Legacy user with kennitala → auto-migration on sign-in
   - [ ] Legacy user without kennitala → magic link flow
   - [ ] Magic link expiry (24 hours)
   - [ ] Magic link single-use enforcement
   - [ ] Session `isActive` status after migration
   - [ ] Error handling for invalid/expired tokens
   - [ ] Email delivery verification

---

## File Summary

### New Files to Create

| File | Type | Description | Status |
|------|------|-------------|--------|
| `db/migrations/m-20251202-legacy-subscribers.js` | Migration | Database schema | ✅ Created |
| `models/legacy-subscriber.model.ts` | Model | Legacy user data | ✅ Created |
| `models/legacy-migration-token.model.ts` | Model | Magic link tokens | ✅ Created |
| `modules/legacy-migration/legacy-migration.provider.module.ts` | Module | Service providers | ✅ Created |
| `modules/legacy-migration/legacy-migration.controller.module.ts` | Module | Controller setup | ✅ Created |
| `modules/legacy-migration/legacy-migration.controller.ts` | Controller | API endpoints | ✅ Created |
| `modules/legacy-migration/legacy-migration.service.ts` | Service | Business logic | ✅ Created |
| `modules/legacy-migration/legacy-migration.service.interface.ts` | Interface | Service contract | ✅ Created |
| `modules/legacy-migration/legacy-migration.service.spec.ts` | Tests | Service unit tests | ✅ Created |
| `modules/legacy-migration/legacy-migration.dto.ts` | DTOs | Request/Response DTOs | ✅ Created |
| `app/skraning/flytja/page.tsx` | Page | Migration completion UI | ✅ Created |
| `lib/trpc/server/routers/legacyMigrationRouter.ts` | Router | tRPC routes | ✅ Created |

### Files to Modify

| File | Changes | Status |
|------|---------|--------|
| `app/app.module.ts` | Register new models and modules | ✅ Done |
| `core/constants.ts` | Add LEGACY_SUBSCRIBER, LEGACY_MIGRATION_TOKEN enums | ✅ Done |
| `models/subscriber.model.ts` | Fix isActive type from `false` to `boolean` | ✅ Done |
| `subscriber.service.ts` | Add auto-migration check | ✅ Done |
| `app/skraning/@register/page.tsx` | Add redemption UI | ✅ Done |
| `lib/trpc/server/routers/_app.ts` | Add legacyMigrationRouter | ✅ Done |

---

## Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Database Schema | ✅ Complete | Migration file + Sequelize models |
| Phase 2: Backend Service Tests (TDD) | ✅ Complete | 19 test cases covering all service methods |
| Phase 3: Backend Services Implementation | ✅ Complete | Service, Controller, DTOs, Modules - all 19 tests passing |
| Phase 4: Email Integration | ✅ Complete | Implemented in service using IAWSService.sendMail() |
| Phase 5: Auto-Migration on Sign-In | ✅ Complete | Integrated in SubscriberService.getUserByNationalId() |
| Phase 6: Frontend Updates | ✅ Complete | Registration page with legacy redemption form + migration completion page |

---

## Related Plans

- [TBR Subscription Payment](../legal-gazette/plan-tbr-subscription-payment.md) - Payment integration for new subscribers
- [Legacy Data Import](../legal-gazette/plan-legacy-data-import.md) - Import legacy subscriber data from old system
