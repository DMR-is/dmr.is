# Plan: High Priority Issues TDD Fix

> **Created:** January 7, 2026  
> **Target Completion:** January 21, 2026  
> **Status:** ⬜ Not Started  
> **Approach:** Test-Driven Development (TDD)

---

## Overview

This plan outlines a TDD approach to fixing the 15 remaining high priority issues identified in the code review. For each issue, we will:

1. **Write failing tests** that demonstrate the bug
2. **Verify the tests fail** (red)
3. **Implement the fix**
4. **Verify the tests pass** (green)
5. **Refactor if needed**

---

## High Priority Issues Summary

### Phase 2: Security Issues (Before Production) 🟠

| ID | Issue | Location | Impact | Status |
|----|-------|----------|--------|--------|
| H-1 | MachineClientGuard Scope Validation | `authorization.guard.ts` | Security bypass | ✅ Complete |
| H-2 | Missing Ownership Validation on Recall Endpoints | `recall-application.controller.ts` | Unauthorized access | ✅ Complete |
| H-3 | No Rate Limiting on External System Endpoints | Foreclosure, Company controllers | DoS vulnerability | ✅ Complete |
| H-4 | No Input Sanitization for HTML Content | `foreclosure.service.ts` | XSS vulnerability | ⬜ Not Started |
| H-5 | PII (National IDs) Logged Without Masking | Multiple files | GDPR violation | ✅ Complete |

### Phase 3: Data Integrity Issues (Before Production) 🟠

| ID | Issue | Location | Impact | Status |
|----|-------|----------|--------|--------|
| H-6 | Publication Number Generation Race Condition | `publication.service.ts` | Duplicate numbers | ✅ Complete |
| H-7 | Published Versions Can Be Hard-Deleted | `publication.service.ts` | Data loss | ⬜ Not Started |
| H-8 | Missing Status Check on Application Submission | `application.service.ts` | Invalid state | ⬜ Not Started |
| H-9 | Missing Status Check on Application Update | `application.service.ts` | Invalid state | ⬜ Not Started |
| H-10 | No Transaction in AdvertPublishedListener | `advert-published.listener.ts` | Partial updates | ⬜ Not Started |
| H-11 | Missing ON DELETE Behavior for Foreign Keys | Migrations | Orphan records | ⬜ Not Started |

### Phase 4: Reliability Issues (Week 1 Post-Release) 🟠

| ID | Issue | Location | Impact | Status |
|----|-------|----------|--------|--------|
| H-12 | PDF Generation Failure Without Retry | `advert-published.listener.ts` | Missing PDFs | ⬜ Not Started |
| H-13 | TBR Payment Creation Without Failure Recovery | `advert-published.listener.ts` | Lost payments | ⬜ Not Started |
| H-14 | Missing Payment Status Polling | New task service | Stale payment status | ⬜ Not Started |
| H-15 | External API Calls Lack Request Timeouts | External services | Hanging requests | ⬜ Not Started |
| H-16 | National Registry Token Never Refreshed | `national-registry.service.ts` | Auth failures | ⬜ Not Started |

---

## Implementation Order

Based on dependencies, risk, and production readiness:

| Priority | Issue | Reason | Effort | Status |
|----------|-------|--------|--------|--------|
| 1 | H-2 | Security - authorization bypass | 2h | ✅ Complete |
| 2 | H-5 | Security - GDPR compliance | 3h | ✅ Complete |
| 3 | H-4 | Security - XSS vulnerability | 4h | ⬜ Not Started |
| 4 | H-6 | Data integrity - duplicate publication numbers | 3h | ✅ Complete |
| 5 | H-7 | Data integrity - prevent published version deletion | 2h | ⬜ Not Started |
| 6 | H-8, H-9 | Data integrity - application state machine | 4h | ⬜ Not Started |
| 7 | H-10 | Data integrity - transaction safety | 2h | ⬜ Not Started |
| 8 | H-3 | Security - rate limiting | 2h | ✅ Complete |
| 9 | H-11 | Data integrity - foreign key constraints | 4h | ⬜ Not Started |
| 10 | H-15 | Reliability - timeouts | 3h | ⬜ Not Started |
| 11 | H-12 | Reliability - PDF retry | 8h | ⬜ Not Started |
| 12 | H-13 | Reliability - TBR retry | 8h | ⬜ Not Started |
| 13 | H-14 | Reliability - payment polling | 4h | ⬜ Not Started |
| 14 | H-16 | Reliability - token refresh | 4h | ⬜ Not Started |

---

## Phase 2: Security Issues

### H-2: Missing Ownership Validation on Recall Min Date Endpoints

#### Problem Statement

The `RecallApplicationController` endpoints for `getMinDateForDivisionMeeting` and `getMinDateForDivisionEnding` only check for valid `ApplicationWebScopes()` but don't verify that the requesting user owns the application.

#### Current Code Location

[apps/legal-gazette-api/src/modules/applications/recall/recall-application.controller.ts](apps/legal-gazette-api/src/modules/applications/recall/recall-application.controller.ts)

#### Impact

- Users can access application data they don't own
- Information disclosure vulnerability
- Authorization bypass

#### Solution Implemented

**Guard-Based Authorization** - Created reusable `ApplicationOwnershipGuard` to handle ownership validation across all endpoints needing application access control.

**Files Changed:**
- Created: `apps/legal-gazette-api/src/core/guards/application-ownership.guard.ts`
- Created: `apps/legal-gazette-api/src/core/guards/application-ownership.guard.spec.ts`
- Modified: `apps/legal-gazette-api/src/modules/applications/recall/recall-application.controller.ts`
- Modified: `apps/legal-gazette-api/src/modules/applications/recall/recall-application.service.ts`
- Modified: `apps/legal-gazette-api/src/modules/applications/recall/recall-application.service.interface.ts`
- Updated: `apps/legal-gazette-api/src/modules/applications/recall/recall-application.controller.spec.ts`
- Rewritten: `apps/legal-gazette-api/src/modules/applications/recall/recall-application.service.spec.ts`

#### Test Plan

#### Test Plan

**Test Files:**
- `apps/legal-gazette-api/src/core/guards/application-ownership.guard.spec.ts` (7 tests)
- `apps/legal-gazette-api/src/modules/applications/recall/recall-application.controller.spec.ts` (8 tests)
- `apps/legal-gazette-api/src/modules/applications/recall/recall-application.service.spec.ts` (8 tests)

**Guard Tests (ApplicationOwnershipGuard):**
```typescript
describe('ApplicationOwnershipGuard', () => {
  it('should allow access when user is the owner')
  it('should allow access when user is an admin')
  it('should throw NotFoundException when application does not exist')
  it('should throw ForbiddenException when user is not owner and not admin')
  it('should allow access when user is both owner and admin')
  it('should handle missing user in request')
  it('should handle missing applicationId in params')
})
```

**Controller Tests:**
```typescript
describe('RecallApplicationController', () => {
  describe('getMinDateForDivisionMeeting', () => {
    it('should call service method when ApplicationOwnershipGuard passes')
    it('should have ApplicationOwnershipGuard configured on method')
  })
  describe('getMinDateForDivisionEnding', () => {
    it('should call service method when ApplicationOwnershipGuard passes')
    it('should have ApplicationOwnershipGuard configured on method')
  })
  // Tests for addDivisionMeeting and addDivisionEnding
})
```

**Service Tests (Business Logic Only):**
```typescript
describe('RecallApplicationService', () => {
  describe('getMinDateForDivisionMeeting', () => {
    it('should return next valid publishing date when no adverts exist')
    it('should return 5 business days after previous division meeting')
    it('should return 63 days after first recall publication')
    it('should return 5 business days after division meeting date from recall advert')
  })
  describe('getMinDateForDivisionEnding', () => {
    it('should return next business day after latest division meeting')
    it('should return 63 days after first recall publication')
    it('should return next business day after division meeting date')
    it('should return next valid publishing date when no adverts exist')
  })
})
```

#### Implementation

**Step 1: Create ApplicationOwnershipGuard**
```typescript
// apps/legal-gazette-api/src/core/guards/application-ownership.guard.ts
@Injectable()
export class ApplicationOwnershipGuard implements CanActivate {
  constructor(
    @InjectModel(ApplicationModel) private applicationModel: typeof ApplicationModel,
    @Inject(LOGGER_PROVIDER) private logger: Logger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user: DMRUser = request.user
    const { applicationId } = request.params

    const application = await this.applicationModel.findByPk(applicationId)
    if (!application) {
      throw new NotFoundException(`Application with id ${applicationId} not found`)
    }

    const isAdmin = user?.scope?.includes('@logbirtingablad.is/admin') ?? false
    const isOwner = application.applicantNationalId === user?.nationalId

    if (!isAdmin && !isOwner) {
      this.logger.warn('User attempted to access application they do not own', {
        applicationId,
        userNationalId: user?.nationalId,
      })
      throw new ForbiddenException('You do not have permission to access this application')
    }

    return true
  }
}
```

**Step 2: Apply Guard to Controller Endpoints**
```typescript
// In recall-application.controller.ts
import { ApplicationOwnershipGuard } from '../../../core/guards/application-ownership.guard'

@UseGuards(ApplicationOwnershipGuard)
@Get(':applicationId/divisionMeeting/minDate')
async getMinDateForDivisionMeeting(
  @Param('applicationId') applicationId: string,
): Promise<GetMinDateResponseDto> {
  return this.applicationService.getMinDateForDivisionMeeting(applicationId)
}

@UseGuards(ApplicationOwnershipGuard)
@Get(':applicationId/divisionEnding/minDate')
async getMinDateForDivisionEnding(
  @Param('applicationId') applicationId: string,
): Promise<GetMinDateResponseDto> {
  return this.applicationService.getMinDateForDivisionEnding(applicationId)
}
```

**Step 3: Simplify Service (Remove Authorization Logic)**
```typescript
// In recall-application.service.ts
// REMOVED: validateApplicationOwnership() method
// REMOVED: user parameter from getMinDateForDivisionMeeting/Ending

async getMinDateForDivisionMeeting(
  applicationId: string,
): Promise<GetMinDateResponseDto> {
  // Pure business logic - no authorization checks
  // Guard handles authorization before method is called
  // ...
}
```

#### Status

| Step | Status | Notes |
|------|--------|-------|
| Write test files | ✅ Complete | Guard tests (7), controller tests (8), service tests (8) |
| Verify tests fail | ✅ Complete | Tests failed as expected - no ownership validation |
| Implement ApplicationOwnershipGuard | ✅ Complete | Reusable guard for all application ownership checks |
| Apply guard to controller | ✅ Complete | Added @UseGuards(ApplicationOwnershipGuard) to endpoints |
| Simplify service | ✅ Complete | Removed validation logic, pure business logic only |
| Verify tests pass | ✅ Complete | All 23 tests passing (7 guard + 8 controller + 8 service) |
| Code review | ⬜ Pending | |

**Completion Date:** January 7, 2026

**Key Benefits:**
- ✅ **Separation of Concerns**: Authorization in guard, business logic in service
- ✅ **Reusability**: Guard can be applied to any endpoint needing ownership checks
- ✅ **Declarative**: Clear `@UseGuards()` decorator shows authorization requirement
- ✅ **Testability**: Guard, controller, and service tested independently
- ✅ **NestJS Best Practice**: Follows framework patterns for guards

---

### H-3: No Rate Limiting on External System Endpoints

#### Problem Statement

External system endpoints (foreclosure, company) are publicly accessible to machine clients without rate limiting, enabling DoS attacks.

#### Current Code Location

- `apps/legal-gazette-api/src/modules/external-systems/foreclosure/foreclosure.controller.ts`
- `apps/legal-gazette-api/src/modules/external-systems/company/company.controller.ts`

#### Impact

- DoS attacks possible
- Resource exhaustion
- Service degradation

#### Test Plan

**Test File:** `apps/legal-gazette-api/src/modules/external-systems/rate-limiting.spec.ts`

```typescript
describe('Rate Limiting (H-3)', () => {
  describe('Foreclosure endpoints', () => {
    it('should allow requests under rate limit', async () => {
      // Action: Make 5 requests within 1 minute
      // Assert: All requests succeed (200)
    })

    it('should return 429 when rate limit exceeded', async () => {
      // Action: Make 15 requests within 1 minute (limit is 10)
      // Assert: Request 11+ should return 429 Too Many Requests
    })

    it('should reset rate limit after window expires', async () => {
      // Action: Exceed limit, wait for window reset
      // Assert: New requests succeed
    })
  })

  describe('Company endpoints', () => {
    // Same patterns
  })
})
```

#### Implementation

```typescript
// Install @nestjs/throttler if not present
// npm install @nestjs/throttler

// In app.module.ts or a new throttler.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,  // 1 minute
        limit: 10,   // 10 requests per minute
      },
      {
        name: 'long',
        ttl: 60000 * 60,  // 1 hour
        limit: 100,  // 100 requests per hour
      },
    ]),
  ],
})
export class ThrottlerConfigModule {}

// In foreclosure.controller.ts
import { Throttle, SkipThrottle } from '@nestjs/throttler'

@Controller('external/foreclosure')
@Throttle({ short: { limit: 10, ttl: 60000 } })
export class ForeclosureController {
  // ...
}
```

#### Status

| Step | Status | Notes |
|------|--------|-------|
| Install throttler | ✅ Complete | @nestjs/throttler v6.x installed |
| Write test file | ✅ Complete | 14 comprehensive tests in rate-limiting.spec.ts |
| Verify tests fail | ✅ Complete | Tests failed correctly, no rate limiting detected |
| Implement fix | ✅ Complete | ThrottlerModule + guards on both controllers |
| Verify tests pass | ✅ Complete | All 14 tests passing + no regressions (190 total) |
| Code review | ⬜ Pending | |

**Completion Date:** January 7, 2026

**Key Implementation Details:**
- ✅ **Rate Limiting**: Default 5000 (req/hour) window
- ✅ **Guard-Based**: ThrottlerGuard applied to ForeclosureController and CompanyController
- ✅ **Declarative Config**: @Throttle decorator specifies limits at controller level
- ✅ **Test Coverage**: Tests verify module config, guard presence, and rate limiting behavior
- ✅ **No Regressions**: All 190 existing tests still pass

**Files Changed:**
- Created: `apps/legal-gazette-api/src/modules/external-systems/rate-limiting.spec.ts` (14 tests)
- Modified: `apps/legal-gazette-api/src/app/app.module.ts` (added ThrottlerModule)
- Modified: `apps/legal-gazette-api/src/modules/external-systems/foreclosure/foreclosure.controller.ts` (added guard + decorator)
- Modified: `apps/legal-gazette-api/src/modules/external-systems/company/company.controller.ts` (added guard + decorator)

---

### H-4: No Input Sanitization for HTML Content in External DTOs

#### Problem Statement

User-provided content from external systems (company names, addresses, respondent names) is directly interpolated into HTML templates without sanitization, enabling XSS attacks.

#### Current Code Location

[apps/legal-gazette-api/src/modules/external-systems/foreclosure/foreclosure.service.ts](apps/legal-gazette-api/src/modules/external-systems/foreclosure/foreclosure.service.ts)

#### Impact

- Stored XSS vulnerability
- Admin session hijacking
- Public website contamination

#### Test Plan

**Test File:** `apps/legal-gazette-api/src/modules/external-systems/foreclosure/foreclosure.service.spec.ts`

```typescript
describe('HTML Sanitization (H-4)', () => {
  describe('createForeclosureSale', () => {
    it('should escape HTML in foreclosureRegion', async () => {
      // Setup: Create foreclosure with malicious region name
      const maliciousInput = '<script>alert("XSS")</script>'
      
      // Action: Create foreclosure sale
      const result = await service.createForeclosureSale({
        foreclosureRegion: maliciousInput,
        // ... other fields
      })
      
      // Assert: HTML entities should be escaped in generated content
      expect(result.title).not.toContain('<script>')
      expect(result.title).toContain('&lt;script&gt;')
    })

    it('should escape HTML in responsibleParty.name', async () => {
      // Same pattern
    })

    it('should escape HTML in property names', async () => {
      // Same pattern
    })

    it('should escape HTML in claimant and respondent names', async () => {
      // Same pattern
    })
  })

  describe('HTML template generation', () => {
    it('should produce safe HTML output', async () => {
      // Setup: Create foreclosure with various malicious inputs
      // Action: Generate HTML content
      // Assert: No unescaped tags in output
    })
  })
})
```

#### Implementation

```typescript
// Create a sanitization utility
// libs/shared/utils/src/lib/html-sanitizer.ts
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// OR use a library like html-escaper
// npm install html-escaper
import { escape } from 'html-escaper'

// In foreclosure.service.ts
async createForeclosureSale(body: CreateForeclosureSaleDto): Promise<ForeclosureDto> {
  // Sanitize all user-provided strings before use
  const sanitizedBody = {
    ...body,
    foreclosureRegion: escapeHtml(body.foreclosureRegion),
    foreclosureAddress: escapeHtml(body.foreclosureAddress),
    responsibleParty: {
      ...body.responsibleParty,
      name: escapeHtml(body.responsibleParty.name),
      signature: {
        ...body.responsibleParty.signature,
        name: escapeHtml(body.responsibleParty.signature.name),
        onBehalfOf: body.responsibleParty.signature.onBehalfOf 
          ? escapeHtml(body.responsibleParty.signature.onBehalfOf)
          : undefined,
      },
    },
    properties: body.properties.map(prop => ({
      ...prop,
      propertyName: escapeHtml(prop.propertyName),
      claimant: escapeHtml(prop.claimant),
      respondent: escapeHtml(prop.respondent),
    })),
  }
  
  // ... rest of logic using sanitizedBody
}
```

#### Status

| Step | Status | Notes |
|------|--------|-------|
| Create sanitization utility | ⬜ Not Started | |
| Write test file | ⬜ Not Started | |
| Verify tests fail | ⬜ Not Started | |
| Implement fix | ⬜ Not Started | |
| Verify tests pass | ⬜ Not Started | |
| Code review | ⬜ Not Started | |

---

### H-5: PII (National IDs) Logged Without Masking

#### Problem Statement

National IDs are logged in metadata objects without masking. The `@dmr.is/logging` library only masks strings containing "kennitala" patterns in message strings, not in metadata objects.

#### Current Code Location

Multiple files including:
- `apps/legal-gazette-api/src/core/guards/authorization.guard.ts`
- `apps/legal-gazette-api/src/modules/subscribers/listeners/subscriber-created.listener.ts`
- Various service files

#### Impact

- GDPR violation
- PII exposure in log aggregators
- Compliance risk

#### Test Plan

**Test File:** `libs/logging/src/lib/pii-masking.spec.ts`

```typescript
describe('PII Masking (H-5)', () => {
  describe('maskNationalId utility', () => {
    it('should mask 10-digit national ID', () => {
      expect(maskNationalId('1234567890')).toBe('123456****')
    })

    it('should mask national ID with dash', () => {
      expect(maskNationalId('123456-7890')).toBe('123456-****')
    })

    it('should return undefined for undefined input', () => {
      expect(maskNationalId(undefined)).toBe(undefined)
    })

    it('should return null for null input', () => {
      expect(maskNationalId(null)).toBe(null)
    })
  })

  describe('logger metadata masking', () => {
    it('should auto-mask nationalId in metadata', () => {
      // Setup: Configure logger with metadata masking
      const logOutput = captureLogOutput(() => {
        logger.info('Test message', { nationalId: '1234567890' })
      })
      
      // Assert: nationalId should be masked in output
      expect(logOutput).toContain('123456****')
      expect(logOutput).not.toContain('1234567890')
    })

    it('should auto-mask nested nationalId fields', () => {
      // Same pattern for nested objects
    })
  })
})
```

#### Implementation

```typescript
// Option A: Create maskNationalId utility and use explicitly
// libs/shared/utils/src/lib/pii-masking.ts
export function maskNationalId(nationalId: string | null | undefined): string | null | undefined {
  if (!nationalId) return nationalId
  
  // Handle format with dash: 123456-7890
  if (nationalId.includes('-')) {
    const [first, second] = nationalId.split('-')
    return `${first}-****`
  }
  
  // Handle format without dash: 1234567890
  if (nationalId.length >= 10) {
    return `${nationalId.slice(0, 6)}****`
  }
  
  return '****'
}

// Usage in services:
import { maskNationalId } from '@dmr.is/utils'

logger.info('Processing subscriber', {
  subscriberId: subscriber.id,
  nationalId: maskNationalId(subscriber.nationalId),  // Masked
})

// Option B: Extend logger formatter to auto-mask (better for existing code)
// libs/logging/src/lib/formatters/pii-masker.ts
export function maskPiiInMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['nationalId', 'kennitala', 'ssn', 'national_id']
  const masked = { ...metadata }
  
  for (const key of Object.keys(masked)) {
    if (sensitiveKeys.includes(key.toLowerCase()) && typeof masked[key] === 'string') {
      masked[key] = maskNationalId(masked[key] as string)
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskPiiInMetadata(masked[key] as Record<string, unknown>)
    }
  }
  
  return masked
}
```

#### Files to Update

After implementing the utility, search and update all log statements:

```bash
grep -r "nationalId:" apps/legal-gazette-api/src --include="*.ts" | grep -v ".spec.ts"
```

Known locations:
- `authorization.guard.ts` (line ~180)
- `subscriber-created.listener.ts` (multiple)
- `subscriber.service.ts` (multiple)
- `application.service.ts` (potential)

#### Status

| Step | Status | Notes |
|------|--------|-------|
| Create maskPiiInObject in logging lib | ✅ Complete | Added to libs/logging/src/lib/maskNationalId.ts |
| Extend logger formatter | ✅ Complete | Updated libs/logging/src/lib/formatters.ts |
| Write test files | ✅ Complete | 14 tests in maskNationalId.spec.ts, 10 in formatters.spec.ts |
| Verify tests pass | ✅ Complete | All 27 logging tests passing |
| Code review | ⬜ Pending | |

**Completion Date:** January 7, 2026

**Key Implementation:**
- ✅ Added `maskPiiInObject()` function to `@dmr.is/logging` library
- ✅ Recursively masks PII fields: `nationalId`, `kennitala`, `ssn`, `national_id`
- ✅ Handles nested objects and arrays
- ✅ Preserves Winston symbols (MESSAGE)
- ✅ Environment-aware: dev shows `**REMOVE_PII: [kt]**`, prod shows `--MASKED--`
- ✅ Reuses existing `maskNationalId()` validator logic
- ✅ No code duplication - all PII masking centralized in logging library

**Files Modified:**
- `libs/logging/src/lib/maskNationalId.ts` - Added maskPiiInObject function
- `libs/logging/src/lib/formatters.ts` - Integrated metadata masking
- `libs/logging/src/lib/maskNationalId.spec.ts` - Added 14 new tests
- `libs/logging/src/lib/formatters.spec.ts` - Added 9 new tests

---

## Phase 3: Data Integrity Issues

### H-6: Publication Number Generation Race Condition

#### Problem Statement

Publication number generation uses a `findOne` with `ORDER BY` to get max, then increments. This is not atomic and can generate duplicate publication numbers under concurrent load.

#### Current Code Location

[apps/legal-gazette-api/src/modules/advert/publications/publication.service.ts](apps/legal-gazette-api/src/modules/advert/publications/publication.service.ts) - Lines 256-267

Also in: `apps/legal-gazette-api/src/modules/advert/tasks/publishing/publishing.task.ts` - Line 56

#### Bug Details

```typescript
// Current problematic code (publication.service.ts line 263)
const publishCount = (
  maxPublication && maxPublication.publicationNumber
    ? parseInt(maxPublication.publicationNumber.slice(8), 11) + 1  // BUG: radix 11!
    : 1
)
```

**Two issues:**
1. **Race condition**: No locking between read and write
2. **Wrong radix**: Uses radix 11 instead of 10 for parseInt

#### Test Plan

**Test File:** `apps/legal-gazette-api/src/modules/advert/publications/publication.service.spec.ts`

```typescript
describe('Publication Number Generation (H-6)', () => {
  describe('parseInt radix fix (M-1)', () => {
    it('should correctly parse publication number with radix 10', async () => {
      // Setup: Create advert with publication number ending in "009"
      const existing = createMockAdvert({ publicationNumber: '20260107009' })
      
      // Action: Publish new advert
      // Assert: Next publication number should be 20260107010, not something weird
    })

    it('should handle high sequence numbers correctly', async () => {
      // Setup: Create advert with publication number ending in "999"
      // Action: Publish new advert
      // Assert: Should be 20260107001000 (4 digits)
    })
  })

  describe('race condition prevention', () => {
    it('should generate unique publication numbers under concurrent load', async () => {
      // Setup: Prepare 10 adverts for publication
      // Action: Publish all 10 concurrently using Promise.all
      // Assert: All 10 should have unique publication numbers
    })

    it('should use pessimistic locking to prevent duplicates', async () => {
      // This is more of an integration test
      // Verify that Transaction.LOCK.UPDATE is used
    })
  })
})
```

#### Implementation

```typescript
// In publication.service.ts - publishAdvertPublication method
async publishAdvertPublication(
  advertId: string,
  publicationId: string,
): Promise<void> {
  await this.sequelize.transaction(async (t) => {
    const pubDate = new Date()
    
    const advert = await this.advertModel
      .withScope('detailed')
      .findByPkOrThrow(advertId, { transaction: t })

    const publication = await this.advertPublicationModel.findOneOrThrow({
      where: { id: publicationId, advertId },
      transaction: t,
    })

    if (publication.publishedAt) {
      throw new BadRequestException('Publication already published')
    }

    if (!advert.publicationNumber) {
      const year = pubDate.getFullYear()
      const month = (pubDate.getMonth() + 1).toString().padStart(2, '0')
      const day = pubDate.getDate().toString().padStart(2, '0')

      // FIX: Add pessimistic lock to prevent race condition
      const maxPublication = await this.advertModel.findOne({
        attributes: ['id', 'publicationNumber'],
        where: {
          publicationNumber: {
            [Op.like]: `${year}${month}${day}%`,
          },
        },
        order: [['publicationNumber', 'DESC']],
        limit: 1,
        lock: Transaction.LOCK.UPDATE,  // ADD: Pessimistic lock
        transaction: t,                  // ADD: Use transaction
      })

      // FIX: Use radix 10, not 11
      const publishCount = (
        maxPublication && maxPublication.publicationNumber
          ? parseInt(maxPublication.publicationNumber.slice(8), 10) + 1
          : 1
      )
        .toString()
        .padStart(3, '0')

      const publicationNumber = `${year}${month}${day}${publishCount}`

      await advert.update({
        publicationNumber,
        statusId: StatusIdEnum.PUBLISHED,
      }, { transaction: t })  // ADD: Use transaction
    }

    await publication.update({ publishedAt: new Date() }, { transaction: t })

    // ... afterCommit logic
  })
}
```

#### Solution Implemented

**Two bugs fixed:**

1. **Radix Bug (M-1)**: Changed `parseInt(publicationNumber.slice(8), 11)` to `parseInt(publicationNumber.slice(8), 10)`
2. **Race Condition**: Added pessimistic locking with `lock: Transaction.LOCK.UPDATE` and `transaction: t` to findOne query

**Files Changed:**
- `apps/legal-gazette-api/src/modules/advert/publications/publication.service.ts`
- `apps/legal-gazette-api/src/modules/advert/tasks/publishing/publishing.task.ts`
- `apps/legal-gazette-api/src/modules/advert/publications/publication.service.spec.ts` (new file, 7 tests)

**Key Implementation Details:**
- ✅ **Pessimistic Lock**: Added `Transaction.LOCK.UPDATE` to prevent concurrent reads
- ✅ **Transaction Context**: Pass transaction `t` to findOne for proper isolation
- ✅ **Correct Radix**: Changed from base 11 to base 10 for parseInt
- ✅ **Applied to Both Locations**: Fixed both publication.service.ts and publishing.task.ts

#### Status

| Step | Status | Notes |
|------|--------|-------|
| Write test file | ✅ Complete | 7 tests in publication.service.spec.ts |
| Verify tests fail | ✅ Complete | 3 tests failed as expected (radix bug, missing transaction, missing lock) |
| Fix radix to 10 | ✅ Complete | M-1 fix included in both files |
| Add transaction lock | ✅ Complete | Added lock: Transaction.LOCK.UPDATE and transaction: t |
| Update publishing.task.ts | ✅ Complete | Same fixes applied |
| Verify tests pass | ✅ Complete | All 7 new tests passing |
| Run full suite | ✅ Complete | All 197 tests passing, no regressions |
| Code review | ⬜ Pending | |

**Completion Date:** January 8, 2026

---

### H-7: Published Versions Can Be Hard-Deleted

#### Problem Statement

The `deleteAdvertPublication` method uses `force: true` which permanently deletes publication records. Published versions (those with `publishedAt` set) should never be deletable.

#### Current Code Location

[apps/legal-gazette-api/src/modules/advert/publications/publication.service.ts](apps/legal-gazette-api/src/modules/advert/publications/publication.service.ts) - Lines 147-176

#### Current Problematic Code

```typescript
async deleteAdvertPublication(id: string, pubId: string): Promise<void> {
  const count = await this.advertPublicationModel.count({
    where: { advertId: id },
  })

  if (count <= 1) {
    throw new BadRequestException('At least one publication must remain')
  }

  // BUG: No check if publication is already published!
  await this.advertPublicationModel.destroy({
    where: {
      id: pubId,
      advertId: id,
    },
    force: true,  // Hard delete!
  })
  // ...
}
```

**Additional bug:** Uses `forEach` with async which doesn't properly await (M-2)

#### Test Plan

**Test File:** `apps/legal-gazette-api/src/modules/advert/publications/publication.service.spec.ts`

```typescript
describe('Delete Publication Protection (H-7)', () => {
  describe('deleteAdvertPublication', () => {
    it('should throw BadRequestException when trying to delete published version', async () => {
      // Setup: Create publication with publishedAt set
      const publishedPub = createMockPublication({ publishedAt: new Date() })
      
      // Action: Attempt to delete
      // Assert: Should throw 'Cannot delete published versions'
    })

    it('should allow deletion of unpublished scheduled versions', async () => {
      // Setup: Create publication without publishedAt
      const scheduledPub = createMockPublication({ publishedAt: null })
      
      // Action: Delete the publication
      // Assert: Should succeed
    })

    it('should maintain at least one publication', async () => {
      // Already tested, but verify it still works
    })

    it('should properly await version renumbering (M-2 fix)', async () => {
      // Setup: Create 3 publications, delete middle one
      // Action: Delete publication 2
      // Assert: Remaining publications should be renumbered 1, 2 (not 1, 3)
    })
  })
})
```

#### Implementation

```typescript
async deleteAdvertPublication(id: string, pubId: string): Promise<void> {
  const count = await this.advertPublicationModel.count({
    where: { advertId: id },
  })

  if (count <= 1) {
    throw new BadRequestException('At least one publication must remain')
  }

  // NEW: Check if publication is already published
  const publication = await this.advertPublicationModel.findOne({
    where: { id: pubId, advertId: id },
  })

  if (!publication) {
    throw new NotFoundException('Publication not found')
  }

  if (publication.publishedAt) {
    throw new BadRequestException('Cannot delete published versions')
  }

  await this.advertPublicationModel.destroy({
    where: {
      id: pubId,
      advertId: id,
    },
    force: true,  // OK for unpublished versions
  })

  const publications = await this.advertPublicationModel.findAll({
    where: { advertId: id },
    order: [
      ['scheduledAt', 'ASC'],
      ['publishedAt', 'ASC'],
    ],
  })

  // FIX M-2: Use for...of instead of forEach with async
  for (let index = 0; index < publications.length; index++) {
    await publications[index].update({ versionNumber: index + 1 })
  }
}
```

#### Status

| Step | Status | Notes |
|------|--------|-------|
| Write test file | ⬜ Not Started | |
| Verify tests fail | ⬜ Not Started | |
| Add publishedAt check | ⬜ Not Started | |
| Fix forEach async (M-2) | ⬜ Not Started | |
| Verify tests pass | ⬜ Not Started | |
| Code review | ⬜ Not Started | |

---

### H-8 & H-9: Missing Status Checks on Application Submission/Update

#### Problem Statement

Application submission and update methods don't validate that the application is in a valid state for the operation. For example, submitting an already-submitted application should fail.

#### Current Code Location

[apps/legal-gazette-api/src/modules/applications/application.service.ts](apps/legal-gazette-api/src/modules/applications/application.service.ts)

#### Test Plan

**Test File:** `apps/legal-gazette-api/src/modules/applications/application.service.spec.ts`

```typescript
describe('Application State Machine (H-8, H-9)', () => {
  describe('submitApplication (H-8)', () => {
    it('should throw BadRequestException when application is already SUBMITTED', async () => {
      // Setup: Create application with status SUBMITTED
      // Action: Call submitApplication
      // Assert: Should throw 'Application has already been submitted'
    })

    it('should throw BadRequestException when application is PROCESSING', async () => {
      // Same pattern for PROCESSING status
    })

    it('should throw BadRequestException when application is COMPLETED', async () => {
      // Same pattern for COMPLETED status
    })

    it('should allow submission when status is DRAFT', async () => {
      // Setup: Create application with status DRAFT
      // Action: Call submitApplication
      // Assert: Should succeed, status should become SUBMITTED
    })
  })

  describe('updateApplication (H-9)', () => {
    it('should throw BadRequestException when application is SUBMITTED', async () => {
      // Can't modify submitted applications
    })

    it('should throw BadRequestException when application is COMPLETED', async () => {
      // Can't modify completed applications
    })

    it('should allow updates when status is DRAFT', async () => {
      // Can modify drafts
    })
  })
})
```

#### Implementation

```typescript
// In application.service.ts
private readonly SUBMITTABLE_STATUSES = [ApplicationStatusEnum.DRAFT]
private readonly EDITABLE_STATUSES = [ApplicationStatusEnum.DRAFT]

async submitApplication(id: string, user: DMRUser): Promise<void> {
  const application = await this.applicationModel.findByPkOrThrow(id)

  if (!this.SUBMITTABLE_STATUSES.includes(application.status)) {
    throw new BadRequestException(
      `Cannot submit application with status '${application.status}'. ` +
      `Application must be in DRAFT status.`
    )
  }

  // ... rest of submission logic
}

async updateApplication(id: string, body: UpdateApplicationDto, user: DMRUser): Promise<void> {
  const application = await this.applicationModel.findByPkOrThrow(id)

  if (!this.EDITABLE_STATUSES.includes(application.status)) {
    throw new BadRequestException(
      `Cannot modify application with status '${application.status}'. ` +
      `Application must be in DRAFT status.`
    )
  }

  // ... rest of update logic
}
```

#### Status

| Step | Status | Notes |
|------|--------|-------|
| Write test file | ⬜ Not Started | |
| Verify tests fail | ⬜ Not Started | |
| Implement H-8 fix | ⬜ Not Started | |
| Implement H-9 fix | ⬜ Not Started | |
| Verify tests pass | ⬜ Not Started | |
| Code review | ⬜ Not Started | |

---

### H-10: No Transaction in AdvertPublishedListener

#### Problem Statement

The `AdvertPublishedListener` methods (PDF generation, email, TBR transaction) run independently without coordination. If one fails partway through, partial state may remain.

#### Current Code Location

[apps/legal-gazette-api/src/modules/advert/publications/listeners/advert-published.listener.ts](apps/legal-gazette-api/src/modules/advert/publications/listeners/advert-published.listener.ts)

#### Note

This issue is **partially resolved** by C-4/C-5 fixes which wrap TBR operations in transactions. The remaining concern is PDF generation and email sending coordination.

#### Test Plan

```typescript
describe('AdvertPublishedListener Transaction Safety (H-10)', () => {
  it('should complete TBR transaction in single DB transaction', async () => {
    // Already tested in C-5 tests
  })

  it('should not fail silently when PDF generation fails', async () => {
    // Setup: Mock PDF service to throw error
    // Action: Emit ADVERT_PUBLISHED event
    // Assert: Error should be logged, but not re-thrown (publication still valid)
  })

  it('should not fail silently when email fails', async () => {
    // Setup: Mock SES to throw error
    // Action: Emit ADVERT_PUBLISHED event
    // Assert: Error should be logged, but not re-thrown
  })
})
```

#### Implementation

The current implementation already handles failures gracefully with `.catch()` for PDF and email. The main transaction work was done in C-5. Mark as **mostly complete** after C-5 verification.

#### Status

| Step | Status | Notes |
|------|--------|-------|
| Verify C-5 implementation | ⬜ Not Started | TBR transaction wrapped |
| Add tests for PDF/email | ⬜ Not Started | Error handling verification |
| Code review | ⬜ Not Started | |

---

### H-11: Missing ON DELETE Behavior for Foreign Keys

#### Problem Statement

Foreign key constraints don't specify `ON DELETE` behavior, leading to orphaned records or constraint violations when parent records are deleted.

#### Current Code Location

Various migration files in `apps/legal-gazette-api/db/migrations/`

#### Tables Requiring Review

| Table | Foreign Key | Recommended Behavior |
|-------|-------------|---------------------|
| `advert_publication` | `advert_id` | `ON DELETE CASCADE` |
| `advert_signature` | `advert_id` | `ON DELETE CASCADE` |
| `advert_communication_channel` | `advert_id` | `ON DELETE CASCADE` |
| `tbr_transaction` | `advert_id` | `ON DELETE SET NULL` |
| `subscriber_transaction` | `subscriber_id` | `ON DELETE CASCADE` |
| `subscriber_transaction` | `transaction_id` | `ON DELETE CASCADE` |
| `foreclosure_property` | `foreclosure_id` | `ON DELETE CASCADE` |
| `application` | `case_id` | `ON DELETE SET NULL` |

#### Migration Required

**File:** `m-YYYYMMDD-add-on-delete-constraints.js`

```javascript
'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    try {
      // Drop and recreate foreign key constraints with ON DELETE behavior
      
      // advert_publication.advert_id
      await queryInterface.sequelize.query(`
        ALTER TABLE advert_publication 
        DROP CONSTRAINT IF EXISTS advert_publication_advert_id_fkey;
        
        ALTER TABLE advert_publication
        ADD CONSTRAINT advert_publication_advert_id_fkey
        FOREIGN KEY (advert_id) REFERENCES advert(id) ON DELETE CASCADE;
      `, { transaction })

      // subscriber_transaction.subscriber_id
      await queryInterface.sequelize.query(`
        ALTER TABLE subscriber_transaction 
        DROP CONSTRAINT IF EXISTS subscriber_transaction_subscriber_id_fkey;
        
        ALTER TABLE subscriber_transaction
        ADD CONSTRAINT subscriber_transaction_subscriber_id_fkey
        FOREIGN KEY (subscriber_id) REFERENCES subscriber(id) ON DELETE CASCADE;
      `, { transaction })

      // ... repeat for other tables

      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Revert to no ON DELETE behavior
    // ...
  },
}
```

#### Status

| Step | Status | Notes |
|------|--------|-------|
| Audit all FKs | ⬜ Not Started | |
| Create migration | ⬜ Not Started | |
| Test in dev | ⬜ Not Started | |
| Verify cascade behavior | ⬜ Not Started | |
| Code review | ⬜ Not Started | |

---

## Phase 4: Reliability Issues

### H-12 & H-13: Retry Logic for PDF and TBR

These are similar problems requiring a retry mechanism with exponential backoff.

#### Implementation Approach

Create a reusable retry utility:

```typescript
// libs/shared/utils/src/lib/retry.ts
export interface RetryOptions {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  onRetry?: (attempt: number, error: Error) => void
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= options.maxRetries + 1; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt > options.maxRetries) {
        throw lastError
      }
      
      const delay = Math.min(
        options.baseDelayMs * Math.pow(2, attempt - 1),
        options.maxDelayMs,
      )
      
      options.onRetry?.(attempt, lastError)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}
```

Usage in listeners:

```typescript
// In advert-published.listener.ts
@OnEvent(LegalGazetteEvents.ADVERT_PUBLISHED)
async generatePdf({ advert, publication, html }: AdvertPublishedEvent) {
  await withRetry(
    () => this.pdfService.generatePdfAndSaveToS3(html, ...),
    {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      onRetry: (attempt, error) => {
        this.logger.warn(`PDF generation retry ${attempt}`, {
          advertId: advert.id,
          error: error.message,
        })
      },
    },
  ).catch((error) => {
    this.logger.error('PDF generation failed after retries', {
      advertId: advert.id,
      error: error.message,
    })
    // TODO: Queue for later retry or alert
  })
}
```

#### Status

| Step | Status | Notes |
|------|--------|-------|
| Create retry utility | ⬜ Not Started | |
| Add H-12 PDF retry | ⬜ Not Started | |
| Add H-13 TBR retry | ⬜ Not Started | |
| Write tests | ⬜ Not Started | |
| Code review | ⬜ Not Started | |

---

### H-14: Payment Status Polling

Create a scheduled task to poll TBR for payment status updates.

```typescript
// apps/legal-gazette-api/src/modules/advert/tasks/payment/payment-status.task.ts
@Injectable()
export class PaymentStatusTask {
  @Cron('*/5 * * * *') // Every 5 minutes
  async pollPaymentStatus() {
    // Find transactions with status CREATED (pending payment)
    const pendingTransactions = await this.tbrTransactionModel.findAll({
      where: { 
        status: TBRTransactionStatus.CREATED,
        createdAt: { [Op.gt]: subDays(new Date(), 30) }, // Last 30 days
      },
      limit: 100,
    })

    for (const transaction of pendingTransactions) {
      try {
        const status = await this.tbrService.getPaymentStatus(transaction.id)
        
        if (status.paid) {
          await transaction.update({
            status: TBRTransactionStatus.PAID,
            paidAt: status.paidAt,
          })
        }
      } catch (error) {
        this.logger.warn('Failed to poll payment status', {
          transactionId: transaction.id,
          error: error.message,
        })
      }
    }
  }
}
```

---

### H-15: External API Timeout Configuration

The TBR service already has a timeout (10 seconds). Verify other external services also have timeouts.

Services to check:
- National Registry API
- X-Road services
- Any other external integrations

#### Implementation

```typescript
// Ensure all fetch/axios calls have timeout
const response = await fetch(url, {
  signal: AbortSignal.timeout(10000), // 10 seconds
  // ...
})
```

---

### H-16: National Registry Token Refresh

Implement token caching with automatic refresh before expiry.

```typescript
@Injectable()
export class NationalRegistryTokenService {
  private token: string | null = null
  private tokenExpiresAt: Date | null = null

  async getToken(): Promise<string> {
    // Check if token exists and is not expiring soon (5 min buffer)
    if (this.token && this.tokenExpiresAt) {
      const bufferMs = 5 * 60 * 1000
      if (this.tokenExpiresAt.getTime() - Date.now() > bufferMs) {
        return this.token
      }
    }

    // Refresh token
    const newToken = await this.fetchNewToken()
    this.token = newToken.accessToken
    this.tokenExpiresAt = new Date(Date.now() + newToken.expiresIn * 1000)
    
    return this.token
  }

  private async fetchNewToken(): Promise<TokenResponse> {
    // Implement token fetch from National Registry OAuth
  }
}
```

---

## Testing Checklist

### Before Each Phase

- [ ] Write failing tests for all issues in phase
- [ ] Verify test coverage is adequate
- [ ] Run existing tests to ensure no regressions

### After Each Fix

- [ ] Verify the specific fix passes
- [ ] Run full test suite
- [ ] Manual verification in dev environment

### Test Commands

```bash
# Run specific test file
nx test legal-gazette-api --testPathPattern="recall-application.service.spec"
nx test legal-gazette-api --testPathPattern="publication.service.spec"
nx test legal-gazette-api --testPathPattern="foreclosure.service.spec"

# Run all high priority tests
nx test legal-gazette-api --testPathPattern="(H-[0-9]+|high-priority)"

# Run full suite
nx test legal-gazette-api
```

---

## Progress Tracking

| Date | Phase | Status | Notes |
|------|-------|--------|-------|
| Jan 7, 2026 | Plan Created | ✅ Complete | |
| Jan 7, 2026 | H-2 Ownership | ✅ Complete | Guard-based authorization with ApplicationOwnershipGuard (23 tests passing) |
| Jan 7, 2026 | H-3 Rate Limiting | ✅ Complete | ThrottlerGuard on external endpoints (14 tests passing) |
| Jan 7, 2026 | H-5 PII Masking | ✅ Complete | Auto-masking in logger metadata (24 tests passing) |
| Jan 8, 2026 | H-6 Race Condition | ✅ Complete | Pessimistic locking + radix fix (7 tests, 197 total passing) |
| | H-4 XSS Prevention | ⬜ Not Started | |
| | H-7 Delete Prevention | ⬜ Not Started | |
| | H-8/H-9 State Machine | ⬜ Not Started | |
| | H-10 Transaction | ⬜ Not Started | Partially done in C-5 |
| | H-11 FK Constraints | ⬜ Not Started | |
| | Phase 4 Reliability | ⬜ Not Started | Post-release |

---

## Open Questions

1. ~~**H-2**: Should delegated users (actor) have access to applications created by the person they represent?~~ **RESOLVED:** Guard checks user.nationalId against applicantNationalId, admin scope bypasses check
2. **H-3**: What rate limits are appropriate? 10/min? 100/hour?
3. **H-4**: Should we use DOMPurify (more thorough) or simple escaping (lighter)?
4. **H-5**: Should we implement auto-masking in the logger, or require explicit masking calls?
5. **H-11**: What's the correct ON DELETE behavior for each FK? Cascade vs Set Null?
6. **H-12/H-13**: How many retries? What's acceptable delay?
7. **H-14**: How often should we poll TBR for payment status?

---

**Document Owner:** Development Team  
**Last Updated:** January 7, 2026  
**Next Review:** Before implementation of each phase
