# Plan: High Priority Issues TDD Fix

> **Created:** January 7, 2026  
> **Target Completion:** January 21, 2026  
> **Status:** ✅ Complete (15/17 issues resolved, 2 partially complete)  
> **Last Updated:** January 9, 2026  
> **Approach:** Test-Driven Development (TDD)

---

## Overview

This plan outlines a TDD approach to fixing the 17 high priority issues identified in the code review. 

**Final Status:**
- ✅ **15 issues fully resolved** with comprehensive test coverage
- 🟡 **H-11**: Audit complete, some FKs fixed, migration needed for remaining
- 🟡 **H-16**: Basic caching implemented, full token refresh deferred to post-release

For each issue, we will:

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
| H-4 | No Input Sanitization for HTML Content | `foreclosure.service.ts` | XSS vulnerability | ✅ Complete |
| H-5 | PII (National IDs) Logged Without Masking | Multiple files | GDPR violation | ✅ Complete |

### Phase 3: Data Integrity Issues (Before Production) 🟠

| ID | Issue | Location | Impact | Status |
|----|-------|----------|--------|--------|
| H-6 | Publication Number Generation Race Condition | `publication.service.ts` | Duplicate numbers | ✅ Complete |
| H-7 | Published Versions Can Be Hard-Deleted | `publication.service.ts` | Data loss | ✅ Complete |
| H-8 | Missing Status Check on Application Submission | `application.service.ts` | Invalid state | ✅ Complete |
| H-9 | Missing Status Check on Application Update | `application.service.ts` | Invalid state | ✅ Complete |
| H-10 | No Transaction in AdvertPublishedListener | `advert-published.listener.ts` | Partial updates | ✅ Complete |
| H-11 | Missing ON DELETE Behavior for Foreign Keys | Migrations | Orphan records | 🟡 Partially Complete |

### Phase 3.5: Business Logic Issues (Before Production) 🟠

| ID | Issue | Location | Impact | Status |
|----|-------|----------|--------|--------|
| H-17 | Publishing Without Payment Validation | `publication.service.ts` | Business model bypass | ✅ Complete |

### Phase 4: Reliability Issues (Week 1 Post-Release) 🟠

| ID | Issue | Location | Impact | Status |
|----|-------|----------|--------|--------|
| H-12 | PDF Generation Failure Without Retry | `advert-published.listener.ts` | Missing PDFs | ✅ Complete |
| H-13 | TBR Payment Creation Without Failure Recovery | `advert-published.listener.ts` | Lost payments | ✅ Complete |
| H-14 | Missing Payment Status Polling | `advert-payment.task.ts` | Stale payment status | ✅ Complete |
| H-15 | External API Calls Lack Request Timeouts | External services | Hanging requests | ✅ Complete |
| H-16 | National Registry Token Never Refreshed | `national-registry.service.ts` | Auth failures | 🟡 Partially Complete |

---

## Implementation Order

Based on dependencies, risk, and production readiness:

| Priority | Issue | Reason | Effort | Status |
|----------|-------|--------|--------|--------|
| 1 | H-2 | Security - authorization bypass | 2h | ✅ Complete |
| 2 | H-5 | Security - GDPR compliance | 3h | ✅ Complete |
| 3 | H-4 | Security - XSS vulnerability | 4h |  ✅ Complete |
| 4 | H-6 | Data integrity - duplicate publication numbers | 3h | ✅ Complete |
| 5 | H-7 | Data integrity - prevent published version deletion | 2h | ✅ Complete |
| 6 | H-8, H-9 | Data integrity - application state machine | 4h | ✅ Complete |
| 7 | H-10 | Data integrity - transaction safety | 2h | ✅ Complete |
| 8 | H-3 | Security - rate limiting | 2h | ✅ Complete |
| 9 | H-17 | Business logic - payment before publish | 4h | ✅ Complete |
| 10 | H-11 | Data integrity - foreign key constraints | 4h | 🟡 Audit Complete |
| 11 | H-15 | Reliability - timeouts | 3h | ✅ Complete |
| 11 | H-12 | Reliability - PDF retry | 4h | ✅ Complete |
| 12 | H-13 | Reliability - TBR retry | 2h | ✅ Complete |
| 13 | H-14 | Reliability - payment polling | 1h | ✅ Complete |
| 14 | H-16 | Reliability - token refresh | 4h | 🟡 Partial Impl |

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

#### Solution Implemented

**HTML Entity Escaping** - Created reusable `escapeHtml()` utility function that converts HTML special characters to entities, preventing XSS attacks in plain text fields.

**Files Changed:**
- Created: `libs/shared/utils/src/lib/escapeHtml.ts` - HTML escape utility
- Created: `libs/shared/utils/src/lib/escapeHtml.spec.ts` - 21 comprehensive tests
- Modified: `libs/shared/utils/src/index.ts` - Export escapeHtml
- Modified: `apps/legal-gazette-api/src/modules/external-systems/foreclosure/foreclosure.service.ts` - Apply escaping
- Created: `apps/legal-gazette-api/src/modules/external-systems/foreclosure/foreclosure.service.spec.ts` - 8 tests

#### Test Plan

**Test Files:**
- `libs/shared/utils/src/lib/escapeHtml.spec.ts` (21 tests)
- `apps/legal-gazette-api/src/modules/external-systems/foreclosure/foreclosure.service.spec.ts` (8 tests)

**Utility Tests (escapeHtml):**
```typescript
describe('escapeHtml', () => {
  it('should escape script tags')
  it('should escape img tags')
  it('should escape iframe tags')
  it('should escape ampersands, quotes, and special characters')
  it('should handle complex XSS payloads')
  it('should return undefined/null for undefined/null input')
  it('should preserve legitimate text while escaping HTML')
  // ... 21 tests total
})
```

**Service Tests:**
```typescript
describe('ForeclosureService - HTML Escaping', () => {
  describe('createForeclosureSale', () => {
    it('should escape HTML in foreclosureRegion field')
    it('should escape HTML in foreclosureAddress field')
    it('should escape HTML in responsibleParty.name field')
    it('should escape HTML in signature.name field')
    it('should escape HTML in signature.onBehalfOf field')
    it('should escape HTML in property fields (propertyName, claimant, respondent)')
    it('should preserve legitimate text content while escaping HTML')
  })
  describe('createForeclosureProperty', () => {
    it('should escape HTML in all property fields when creating a new property')
  })
})
```

#### Implementation

**Utility Function:**
```typescript
// libs/shared/utils/src/lib/escapeHtml.ts
export function escapeHtml(
  unsafe: string | null | undefined,
): string | null | undefined {
  if (unsafe === null) return null
  if (unsafe === undefined) return undefined

  return unsafe
    .replace(/&/g, '&amp;')   // Must be first to avoid double-escaping
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
```

**Applied in Service:**
```typescript
// In foreclosure.service.ts - createForeclosureSale method
import { escapeHtml } from '@dmr.is/utils'

// Escape all user-provided text fields
const escapedRegion = escapeHtml(body.foreclosureRegion) ?? ''
const escapedAddress = escapeHtml(body.foreclosureAddress) ?? ''
const escapedCreatedBy = escapeHtml(body.responsibleParty.name) ?? ''
const escapedSignatureName = escapeHtml(body.responsibleParty.signature.name) ?? ''
const escapedOnBehalfOf = escapeHtml(body.responsibleParty.signature.onBehalfOf)

const escapedProperties = body.properties.map((property) => ({
  ...property,
  propertyName: escapeHtml(property.propertyName) ?? '',
  claimant: escapeHtml(property.claimant) ?? '',
  respondent: escapeHtml(property.respondent) ?? '',
}))

// Use escaped values when creating advert and foreclosure records
```

#### Status

| Step | Status | Notes |
|------|--------|-------|
| Create escapeHtml utility | ✅ Complete | Simple, well-tested utility in @dmr.is/utils |
| Write utility tests | ✅ Complete | 21 tests covering all edge cases |
| Write service tests | ✅ Complete | 8 tests for foreclosure service escaping |
| Verify tests fail | ✅ Complete | All 8 tests failed correctly (RED phase) |
| Implement fix in service | ✅ Complete | Applied escapeHtml to all text fields |
| Verify tests pass | ✅ Complete | All 8 new tests + 210 existing = 218 total passing (GREEN phase) |

**Completion Date:** January 8, 2026

**Key Benefits:**
- ✅ **XSS Prevention**: All user input from external systems is escaped before storage
- ✅ **Reusable Utility**: `escapeHtml()` can be used across the entire codebase
- ✅ **Well-Tested**: 21 utility tests + 8 integration tests = 29 total tests
- ✅ **No Data Loss**: Preserves original text while converting HTML to entities
- ✅ **Simple & Fast**: Pure function with no dependencies
- ✅ **Type-Safe**: Handles null/undefined gracefully

**Character Escaping:**
- `<` → `&lt;`
- `>` → `&gt;`
- `&` → `&amp;` (escaped first to avoid double-escaping)
- `"` → `&quot;`
- `'` → `&#39;`

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

#### Solution Implemented

**Protection Against Published Version Deletion** - Added validation to prevent deletion of published versions and proper null checking for non-existent publications.

**Files Changed:**
- Modified: `apps/legal-gazette-api/src/modules/advert/publications/publication.service.ts`
- Updated: `apps/legal-gazette-api/src/modules/advert/publications/publication.service.spec.ts` (6 new tests)

**Key Implementation Details:**
1. **Published Version Check**: Added validation to throw `BadRequestException` if `publishedAt` is set
2. **Not Found Check**: Added validation to throw `NotFoundException` if publication doesn't exist
3. **M-2 Fix**: Replaced `forEach` with `for...of` loop to properly await version number updates

#### Status

| Step | Status | Notes |
|------|--------|-------|
| Write test file | ✅ Complete | 6 tests added to publication.service.spec.ts |
| Verify tests fail | ✅ Complete | 2 tests failed as expected (no publishedAt check, no null check) |
| Add publishedAt check | ✅ Complete | Throws BadRequestException with "Cannot delete published versions" |
| Add not found check | ✅ Complete | Throws NotFoundException with "Publication not found" |
| Fix forEach async (M-2) | ✅ Complete | Changed to for...of loop to properly await updates |
| Verify tests pass | ✅ Complete | All 13 tests passing (7 H-6 + 6 H-7) |
| Run full suite | ✅ Complete | All 203 tests passing, no regressions |
| Code review | ⬜ Pending | |

**Completion Date:** January 8, 2026

---

### H-8 & H-9: Missing Status Checks on Application Submission/Update

#### Problem Statement

Application submission and update methods don't validate that the application is in a valid state for the operation. Users could submit already-submitted applications or modify applications after submission.

#### Current Code Location

[apps/legal-gazette-api/src/modules/applications/application.service.ts](apps/legal-gazette-api/src/modules/applications/application.service.ts)

#### Impact

- Users can re-submit already submitted applications
- Users can modify applications after they've been submitted
- Data integrity violations in application workflow
- Invalid state transitions

#### Solution Implemented

**Status Validation Guards** - Added status checks at the beginning of both `submitApplication()` and `updateApplication()` methods to validate that the application is in a valid state before processing.

**Files Changed:**
- Created: `apps/legal-gazette-api/src/modules/applications/application.service.spec.ts` (7 tests)
- Modified: `apps/legal-gazette-api/src/modules/applications/application.service.ts`

#### Test Plan

**Test File:** `apps/legal-gazette-api/src/modules/applications/application.service.spec.ts` (7 tests)

```typescript
describe('ApplicationService - Status Validation', () => {
  describe('submitApplication - Status Check Validation', () => {
    it('should throw BadRequestException when application is already SUBMITTED')
    it('should throw BadRequestException when application is IN_PROGRESS')
    it('should throw BadRequestException when application is FINISHED')
  })

  describe('updateApplication - Status Check Validation', () => {
    it('should allow updates when application status is DRAFT')
    it('should throw BadRequestException when application is SUBMITTED')
    it('should throw BadRequestException when application is IN_PROGRESS')
    it('should throw BadRequestException when application is FINISHED')
  })
})
```

#### Implementation

**Added Constants:**
```typescript
private readonly SUBMITTABLE_STATUSES = [ApplicationStatusEnum.DRAFT]
private readonly EDITABLE_STATUSES = [ApplicationStatusEnum.DRAFT]
```

**H-8: submitApplication Status Guard**
```typescript
async submitApplication(id: string, user: DMRUser): Promise<void> {
  const application = await this.applicationModel.findOneOrThrow({
    where: { id: applicationId, applicantNationalId: user.nationalId },
  })

  // Validate application status before submission
  if (!this.SUBMITTABLE_STATUSES.includes(application.status)) {
    throw new BadRequestException(
      `Cannot submit application with status '${application.status}'. Application must be in DRAFT status.`,
    )
  }

  // ... rest of submission logic (unchanged)
}
```

**H-9: updateApplication Status Guard**
```typescript
async updateApplication(id: string, body: UpdateApplicationDto, user: DMRUser): Promise<void> {
  const application = await this.applicationModel.findOneOrThrow({
    where: { id: applicationId, applicantNationalId: user.nationalId },
  })

  // Validate application status before update
  if (!this.EDITABLE_STATUSES.includes(application.status)) {
    throw new BadRequestException(
      `Cannot modify application with status '${application.status}'. Application must be in DRAFT status.`,
    )
  }

  // ... rest of update logic (unchanged)
}
```

#### Status

| Step | Status | Notes |
|------|--------|-------|
| Write test file | ✅ Complete | 7 tests in application.service.spec.ts |
| Verify tests fail | ✅ Complete | All tests failed correctly - validation missing |
| Implement H-8 fix | ✅ Complete | Added SUBMITTABLE_STATUSES guard in submitApplication |
| Implement H-9 fix | ✅ Complete | Added EDITABLE_STATUSES guard in updateApplication |
| Verify tests pass | ✅ Complete | All 7 tests passing |
| Run full suite | ✅ Complete | All 210 tests passing, no regressions |
| Code review | ⬜ Pending | |

**Completion Date:** January 8, 2026

**Key Benefits:**
- ✅ **Early Validation**: Status checked before expensive operations (parsing, database updates)
- ✅ **Clear Error Messages**: Users receive descriptive error explaining why operation failed
- ✅ **State Machine Enforcement**: Only DRAFT applications can be submitted or modified
- ✅ **Minimal Code Change**: Simple guard pattern, easy to maintain and extend
- ✅ **Extensible**: Constants make it easy to add more valid statuses if requirements change

---

### H-10: No Transaction in AdvertPublishedListener

#### Problem Statement

The `AdvertPublishedListener` methods (PDF generation, email, TBR transaction) run independently without coordination. If one fails partway through, partial state may remain.

#### Current Code Location

[apps/legal-gazette-api/src/modules/advert/publications/listeners/advert-published.listener.ts](apps/legal-gazette-api/src/modules/advert/publications/listeners/advert-published.listener.ts)

#### Note

This issue is **partially resolved** by C-4/C-5 fixes which wrap TBR operations in transactions. The remaining concern is PDF generation and email sending coordination.

#### Solution Implemented

**Verification via Tests** - The existing implementation already handles H-10 correctly. Added comprehensive tests to verify error handling and coordination.

**Files Changed:**
- Updated: `apps/legal-gazette-api/src/modules/advert/publications/listeners/advert-published.listener.spec.ts` (10 new tests)

**No Code Changes Required** - The current implementation already has proper error handling:
- PDF generation failures caught with `.catch()` and logged
- Email sending failures caught with `.catch()` and logged
- TBR transactions wrapped in database transactions (C-5 fix)
- All three operations execute independently via event listeners

#### Test Plan

**Test File:** `apps/legal-gazette-api/src/modules/advert/publications/listeners/advert-published.listener.spec.ts` (10 new tests)

```typescript
describe('Error Handling and Coordination (H-10)', () => {
  describe('PDF generation failures', () => {
    it('should not throw when PDF generation fails')
    it('should log error when PDF generation fails')
    it('should succeed when PDF generation succeeds')
  })

  describe('Email sending failures', () => {
    it('should not throw when email sending fails')
    it('should log error when email sending fails')
    it('should succeed when email sending succeeds')
    it('should skip email sending when no communication channels exist')
    it('should skip email sending when communication channels is null/undefined')
  })

  describe('Independent failure handling', () => {
    it('should allow PDF to fail without affecting TBR transaction')
    it('should allow email to fail without affecting TBR transaction')
  })
})
```

#### Implementation

**Existing Error Handling (No Changes Needed):**

```typescript
// PDF generation (line 221-246)
@OnEvent(LegalGazetteEvents.ADVERT_PUBLISHED)
async generatePdf({ advert, publication, html }: AdvertPublishedEvent) {
  await this.pdfService
    .generatePdfAndSaveToS3(...)
    .catch((error) => {
      this.logger.error('Failed to generate PDF after publication', { ... })
    })
}

// Email notification (line 177-219)
@OnEvent(LegalGazetteEvents.ADVERT_PUBLISHED)
async sendEmailNotification({ advert, publication }: AdvertPublishedEvent) {
  await this.sesService.sendMail(message).catch((error) => {
    this.logger.error('Failed to send email after publication', { ... })
  })
}

// TBR transaction (line 42-175) - Already has transaction handling from C-5
```

#### Status

| Step | Status | Notes |
|------|--------|-------|
| Verify C-5 implementation | ✅ Complete | TBR transaction already wrapped in C-5 fix |
| Add tests for PDF/email | ✅ Complete | 10 tests added (3 PDF + 5 email + 2 coordination) |
| Verify tests pass | ✅ Complete | All 10 new tests passing (228 total) |
| Run full suite | ✅ Complete | All 228 tests passing, no regressions |
| Code review | ⬜ Pending | |

**Completion Date:** January 8, 2026

**Key Findings:**
- ✅ **Graceful Degradation**: PDF and email failures don't prevent publication
- ✅ **Error Logging**: All failures properly logged for monitoring
- ✅ **Independent Execution**: Event listeners execute independently via NestJS EventEmitter
- ✅ **Transaction Safety**: TBR operations wrapped in database transactions (C-5)
- ✅ **No Code Changes Required**: Existing implementation already follows best practices

---

## Phase 3.5: Business Logic Issues

### H-17: Publishing Without Payment Validation (C-2 Unfinished)

#### Problem Statement

The `publishAdvertPublication` method in `publication.service.ts` publishes an advert and THEN emits `ADVERT_PUBLISHED` event for payment creation in `t.afterCommit()`. This means:

1. The transaction commits (advert is marked as PUBLISHED)
2. THEN the `ADVERT_PUBLISHED` event is emitted
3. `AdvertPublishedListener.createTBRTransaction()` creates TBR payment

**The Critical Bug:** If the advert's category requires payment, we should validate that payment has been confirmed BEFORE publishing, not create the payment AFTER publishing.

**Current Flow (Problematic):**
```
User clicks "Publish" 
  → publishAdvertPublication() called
  → Transaction: advert.statusId = PUBLISHED, publication.publishedAt = now()
  → Transaction COMMITS ← Advert is now published!
  → afterCommit: emit ADVERT_PUBLISHED event
  → Listener: create TBR payment (may fail)
```

**Correct Flow (Expected):**
```
User clicks "Publish"
  → Check: Does this category require payment?
  → If yes: Check transaction.paidAt is set (payment confirmed)
  → If payment not confirmed: throw BadRequestException
  → If payment confirmed OR category is exempt: proceed with publishing
```

#### Related Issues

- **C-2 in plan-code-review-findings.md** - Marked as "Done" but the resolution describes a manual admin workflow that's NOT enforced in code
- **C-5 in plan-critical-issues-tdd-fix.md** - Fixed orphaned TBR claims but didn't address the core C-2 issue

#### Current Code Location

[apps/legal-gazette-api/src/modules/advert/publications/publication.service.ts](apps/legal-gazette-api/src/modules/advert/publications/publication.service.ts) - `publishAdvertPublication` method (lines 239-338)

#### Impact

- **Business Model Bypass**: Adverts can be published without payment
- **Revenue Loss**: Free publications for paid categories
- **Data Integrity**: Published adverts may never have payment created if listener fails

#### Prerequisites

1. **Clarify payment-exempt categories** with stakeholders (e.g., Government, Court, Free categories)
2. **Determine category association** - where is category info stored on advert?
3. **Confirm TBR transaction relationship** - advert.transactionId or separate lookup?

#### Test Plan

**Test File:** `apps/legal-gazette-api/src/modules/advert/publications/publication.service.spec.ts`

```typescript
describe('publishAdvertPublication - Payment Validation (H-17)', () => {
  describe('payment required categories', () => {
    it('should throw BadRequestException when payment not confirmed', async () => {
      // Setup: Create advert with paid category, transaction exists but paidAt is null
      const advert = createMockAdvert({
        categoryId: PAID_CATEGORY_ID,
        transaction: { id: 'tx-1', paidAt: null }
      })
      
      // Action
      await expect(
        service.publishAdvertPublication(advert.id, publication.id)
      ).rejects.toThrow(BadRequestException)
      
      // Assert: Error message should be descriptive
      await expect(
        service.publishAdvertPublication(advert.id, publication.id)
      ).rejects.toThrow('Payment must be confirmed before publishing')
    })

    it('should throw BadRequestException when transaction is missing', async () => {
      // Setup: Create advert with paid category, no transaction record
      const advert = createMockAdvert({
        categoryId: PAID_CATEGORY_ID,
        transactionId: null
      })
      
      // Action & Assert
      await expect(
        service.publishAdvertPublication(advert.id, publication.id)
      ).rejects.toThrow('Payment required but no transaction found')
    })

    it('should succeed when payment is confirmed (paidAt is set)', async () => {
      // Setup: Create advert with paid category, transaction with paidAt set
      const advert = createMockAdvert({
        categoryId: PAID_CATEGORY_ID,
        transaction: { id: 'tx-1', paidAt: new Date() }
      })
      
      // Action
      await service.publishAdvertPublication(advert.id, publication.id)
      
      // Assert: Publication should be marked as published
      expect(mockPublicationModel.update).toHaveBeenCalledWith(
        expect.objectContaining({ publishedAt: expect.any(Date) })
      )
    })
  })

  describe('payment exempt categories', () => {
    it('should allow publishing without payment for government category', async () => {
      // Setup: Create advert with GOVERNMENT category, no transaction
      const advert = createMockAdvert({
        categoryId: GOVERNMENT_CATEGORY_ID,
        transactionId: null
      })
      
      // Action & Assert: Should succeed without payment
      await expect(
        service.publishAdvertPublication(advert.id, publication.id)
      ).resolves.not.toThrow()
    })

    it('should allow publishing without payment for court category', async () => {
      // Same pattern for COURT category
    })

    it('should allow publishing without payment for free category', async () => {
      // Same pattern for FREE category (if exists)
    })
  })

  describe('edge cases', () => {
    it('should not check payment for subsequent publications (versions B, C)', async () => {
      // Setup: Create advert with version B publication
      // Payment only required for version A (first publication)
      
      // Action & Assert: Should publish without payment validation
    })

    it('should handle already published adverts correctly', async () => {
      // Existing test - should throw 'Publication already published'
    })
  })
})
```

#### Implementation

**Step 1: Add category and transaction includes to advert query**

```typescript
// In publishAdvertPublication - update the advert query
const advert = await this.advertModel
  .withScope('detailed')
  .findByPkOrThrow(advertId, {
    include: [
      {
        model: CategoryModel,
        as: 'category',
        required: true,
      },
      {
        model: TBRTransactionModel,
        as: 'transaction',
        required: false,
      },
    ],
  })
```

**Step 2: Add payment validation before publishing**

```typescript
// After checking if already published, before updating status
if (publication.publishedAt) {
  throw new BadRequestException('Publication already published')
}

// NEW: Validate payment for first publication (version A)
if (publication.versionNumber === 1) {
  await this.validatePaymentBeforePublish(advert)
}
```

**Step 3: Create payment validation helper**

```typescript
/**
 * Validates that payment is confirmed for adverts in paid categories.
 * 
 * Payment is required when:
 * - Category requires payment (not in PAYMENT_EXEMPT_CATEGORIES)
 * - This is the first publication (version A)
 * 
 * @throws BadRequestException if payment is required but not confirmed
 */
private async validatePaymentBeforePublish(advert: AdvertModel): Promise<void> {
  // Determine exempt categories - TODO: make configurable or load from DB
  const PAYMENT_EXEMPT_CATEGORY_SLUGS = [
    'government',      // Government announcements
    'court',           // Court notices
    'ministry',        // Ministry publications
    // Add more as defined by business
  ]

  const categorySlug = advert.category?.slug?.toLowerCase() || ''
  const isExempt = PAYMENT_EXEMPT_CATEGORY_SLUGS.some(
    exempt => categorySlug.includes(exempt)
  )

  if (isExempt) {
    this.logger.debug('Category is payment exempt, skipping payment validation', {
      context: 'PublicationService',
      advertId: advert.id,
      categorySlug: advert.category?.slug,
    })
    return
  }

  // Payment is required - validate transaction exists and is paid
  if (!advert.transactionId) {
    throw new BadRequestException(
      `Payment required but no transaction found for advert ${advert.id}. Create payment before publishing.`
    )
  }

  const transaction = await this.tbrTransactionModel?.findByPk(advert.transactionId)
  
  if (!transaction) {
    throw new BadRequestException(
      `Payment required but transaction not found for advert ${advert.id}.`
    )
  }

  if (!transaction.paidAt) {
    throw new BadRequestException(
      `Payment must be confirmed before publishing advert ${advert.id}. Transaction status: ${transaction.status}`
    )
  }

  this.logger.debug('Payment validated for publishing', {
    context: 'PublicationService',
    advertId: advert.id,
    transactionId: transaction.id,
    paidAt: transaction.paidAt.toISOString(),
  })
}
```

**Step 4: Add TBRTransactionModel to constructor (if not present)**

```typescript
constructor(
  @InjectModel(AdvertPublicationModel)
  readonly advertPublicationModel: typeof AdvertPublicationModel,
  @InjectModel(AdvertModel)
  readonly advertModel: typeof AdvertModel,
  @InjectModel(TBRTransactionModel)  // NEW
  readonly tbrTransactionModel: typeof TBRTransactionModel,
  @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  private eventEmitter: EventEmitter2,
  private sequelize: Sequelize,
) {}
```

#### Dependencies

1. **CategoryModel association** - Must be included in advert query
2. **TBRTransactionModel injection** - Add to constructor
3. **Business rules** - Clarify which categories are payment-exempt

#### Open Questions

1. **Which categories are payment-exempt?** (Government, Court, Ministry, Free?)
2. **Should exempt categories be configurable?** (DB table vs constants)
3. **What about advert-level payment exemptions?** (e.g., waived fees)
4. **Should we create a separate PaymentValidationService?**

#### Alternative Approach: Pre-payment Workflow

Instead of validating at publish time, an alternative approach is:

1. When advert moves to `READY_FOR_PUBLICATION` status, create TBR transaction immediately
2. User pays via TBR (external flow)
3. Background task polls TBR for payment status, updates `paidAt`
4. Admin can only click "Publish" when `paidAt` is set (UI enforcement)
5. Backend `publishAdvertPublication` validates `paidAt` as safety check

This approach requires implementing H-14 (payment status polling) first.

#### Status

| Step | Status | Notes |
|------|--------|-------|
| Clarify business rule | ✅ Complete | All adverts require TBR transactions (no exempt categories) |
| Write test files | ✅ Complete | 4 tests added to publication.service.spec.ts |
| Verify tests fail | ✅ Complete | Tests failed - no payment validation existed |
| Add CategoryModel include | ✅ Complete | Added to publishAdvertPublication findByPkOrThrow |
| Add TBRTransactionModel injection | ✅ Complete | Added to constructor and provider module |
| Implement validatePaymentBeforePublish | ✅ Complete | Private method validates transaction and paidAt |
| Verify tests pass | ✅ Complete | All 4 payment validation tests passing |
| Run full suite | ✅ Complete | All 17 tests passing - no regressions |

**Completion Date:** January 8, 2026

**Key Decisions:**
- ✅ **No payment-exempt categories** - All adverts require TBR transactions
- ✅ **Payment validation only for version A** - Subsequent publications (B, C) skip validation
- ✅ **Validate before publishing** - Prevents publishing without confirmed payment
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
| Audit all FKs | ✅ Complete | Found mix of complete and missing ON DELETE |
| Create migration | ⬜ Not Started | Migration needed for remaining FKs |
| Test in dev | ⬜ Not Started | |
| Verify cascade behavior | ⬜ Not Started | |
| Code review | ⬜ Not Started | |

**Findings (Jan 9, 2026):**
- ✅ **Already have ON DELETE**: `subscriber_transaction` (CASCADE), `foreclosure_property` (CASCADE), `advert_comment` (CASCADE/SET NULL), `subscriber_payments` (CASCADE)
- ❌ **Still need ON DELETE**: `ADVERT_PUBLICATION.ADVERT_ID`, `ADVERT_SIGNATURE.ADVERT_ID`, `ADVERT_COMMUNICATION_CHANNEL.ADVERT_ID`, `TBR_TRANSACTION.ADVERT_ID`, `APPLICATION.CASE_ID`, and many others from initial migration
- **Next Step**: Create migration `m-20260109-add-missing-on-delete-constraints.js` to fix remaining foreign keys
- **Note**: Some tables already properly configured, audit reduced scope of work
| Test in dev | ⬜ Not Started | |
| Verify cascade behavior | ⬜ Not Started | |
| Code review | ⬜ Not Started | |

**Findings (Jan 9, 2026):**
- ✅ **Already have ON DELETE**: `subscriber_transaction` (CASCADE), `foreclosure_property` (CASCADE), `advert_comment` (CASCADE/SET NULL), `subscriber_payments` (CASCADE)
- ❌ **Still need ON DELETE**: `ADVERT_PUBLICATION.ADVERT_ID`, `ADVERT_SIGNATURE.ADVERT_ID`, `ADVERT_COMMUNICATION_CHANNEL.ADVERT_ID`, `TBR_TRANSACTION.ADVERT_ID`, `APPLICATION.CASE_ID`, and others from initial migration
- **Next Step**: Create migration `m-20260109-add-missing-on-delete-constraints.js` to fix remaining foreign keys

---

## Phase 4: Reliability Issues

### H-12: PDF Generation Failure Without Retry ✅ COMPLETED

**Status:** ✅ Completed (Jan 9, 2026)

**Problem:** When PDF generation fails (network timeout, S3 unavailable, puppeteer crash), the advert is published but no PDF is generated. No retry mechanism exists, requiring manual intervention.

**Solution:** Created reusable `withRetry` utility with exponential backoff and applied it to PDF generation.

**Files Changed:**
- Created: `libs/shared/utils/src/lib/withRetry.ts` - Reusable retry utility with exponential backoff
- Created: `libs/shared/utils/src/lib/withRetry.spec.ts` - 16 comprehensive tests for utility
- Modified: `libs/shared/utils/src/index.ts` - Export withRetry utility
- Modified: `apps/legal-gazette-api/src/modules/advert/publications/listeners/advert-published.listener.ts` - Applied retry logic
- Modified: `apps/legal-gazette-api/src/modules/advert/publications/listeners/advert-published.listener.spec.ts` - Added 5 retry tests

#### Test Plan

**Utility Tests** (`withRetry.spec.ts` - 16 tests):
```typescript
describe('withRetry', () => {
  it('should return result immediately on first success')
  it('should return result after retries on eventual success')
  it('should throw last error after exhausting retries')
  it('should throw immediately with maxRetries=0')
  it('should use exponential backoff between retries')
  it('should cap delay at maxDelayMs')
  it('should use default baseDelayMs of 1000ms')
  it('should use default maxDelayMs of 10000ms')
  it('should invoke onRetry callback with attempt number and error')
  it('should not invoke onRetry on final failure')
  it('should not invoke onRetry when first attempt succeeds')
  it('should handle functions returning undefined')
  it('should handle functions returning null')
  it('should handle non-Error rejections')
  it('should use default maxRetries of 3')
  it('should work with empty options object')
})
```

**Listener Tests** (`advert-published.listener.spec.ts` - 5 new tests):
```typescript
describe('PDF Generation Retry Logic', () => {
  it('should retry PDF generation on transient failure')
  it('should give up after max retries and log final error')
  it('should succeed immediately if first attempt succeeds')
  it('should use exponential backoff between retries')
  it('should cap delay at maximum value')
})
```

#### Implementation

**withRetry Utility:**
```typescript
// libs/shared/utils/src/lib/withRetry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    onRetry,
  } = options

  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt > maxRetries) {
        throw lastError
      }

      const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1)
      const delay = Math.min(exponentialDelay, maxDelayMs)

      if (onRetry) {
        onRetry(attempt, lastError)
      }

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}
```

**Applied to PDF Generation:**
```typescript
// In advert-published.listener.ts
@OnEvent(LegalGazetteEvents.ADVERT_PUBLISHED)
async generatePdf({ advert, publication, html }: AdvertPublishedEvent) {
  await withRetry(
    () => this.pdfService.generatePdfAndSaveToS3(
      html,
      publication.advertId,
      publication.id,
      advert.title,
    ),
    {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      onRetry: (attempt, error) => {
        this.logger.warn(`PDF generation retry attempt ${attempt}`, {
          error: error.message,
          advertId: publication.advertId,
          publicationId: publication.id,
        })
      },
    },
  ).catch((error) => {
    this.logger.error('Failed to generate PDF after publication', {
      error: error,
      advertId: publication.advertId,
      publicationId: publication.id,
    })
  })
}
```

#### Status

| Step | Status | Notes |
|------|--------|-------|
| Write test files | ✅ Complete | 16 utility tests + 5 listener tests |
| Verify tests fail | ✅ Complete | 3 tests failed as expected (RED phase) |
| Create withRetry utility | ✅ Complete | Reusable utility in @dmr.is/utils |
| Implement retry in PDF generation | ✅ Complete | Applied withRetry to generatePdf method |
| Verify tests pass | ✅ Complete | All 23 listener tests passing (GREEN phase) |
| Run full suite | ✅ Complete | All 250 tests passing, no regressions |
| Code review | ⬜ Pending | |

**Completion Date:** January 9, 2026

**Key Benefits:**
- ✅ **Automatic Recovery**: Transient failures (network, S3) recover automatically
- ✅ **Exponential Backoff**: Delays increase: 1s → 2s → 4s (capped at 10s)
- ✅ **Comprehensive Logging**: Retry attempts logged with context
- ✅ **Reusable Utility**: Can be applied to TBR and other external calls
- ✅ **Well-Tested**: 21 total tests (16 utility + 5 integration)
- ✅ **No Regressions**: All existing tests still pass

**Configuration:**
- Max Retries: 3 (4 total attempts)
- Base Delay: 1000ms
- Max Delay: 10000ms (10 seconds)
- Backoff Pattern: Exponential (1s, 2s, 4s)

---

### H-13: TBR Payment Creation Without Retry ✅ COMPLETED

**Status:** ✅ Completed (Jan 9, 2026)

**Problem:** TBR payment creation failures are not retried, potentially causing lost payment records. Transient network issues or temporary TBR API unavailability result in immediate payment failures requiring manual intervention.

**Solution:** Applied the `withRetry` utility (created for H-12) to TBR payment creation with exponential backoff.

**Files Changed:**
- Modified: `apps/legal-gazette-api/src/modules/advert/publications/listeners/advert-published.listener.ts` - Applied withRetry to TBR payment
- Modified: `apps/legal-gazette-api/src/modules/advert/publications/listeners/advert-published.listener.spec.ts` - Added 5 TBR retry tests

#### Test Plan

**Listener Tests** (`advert-published.listener.spec.ts` - 5 new tests):
```typescript
describe('TBR Payment Retry Logic (H-13)', () => {
  it('should retry TBR payment on transient failure')
  it('should give up after max retries and mark transaction as FAILED')
  it('should succeed immediately if first TBR call succeeds')
  it('should use exponential backoff between TBR retries')
  it('should log retry attempts for TBR payment')
})
```

#### Implementation

**Applied to TBR Payment Creation:**
```typescript
// In advert-published.listener.ts - Step 2: Call TBR API
await withRetry(
  () => this.tbrService.postPayment(paymentData),
  {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    onRetry: (attempt, error) => {
      this.logger.warn(`TBR payment retry attempt ${attempt}`, {
        error: error.message,
        advertId: advert.id,
        transactionId: transactionRecord.id,
        context: LOGGING_CONTEXT,
      })
    },
  },
)
```

#### Status

| Step | Status | Notes |
|------|--------|-------|
| Write test files | ✅ Complete | 5 TBR retry tests |
| Verify tests fail | ✅ Complete | 4 tests failed as expected (RED phase) |
| Apply withRetry to TBR | ✅ Complete | Reused utility from H-12 |
| Verify tests pass | ✅ Complete | All 28 listener tests passing (GREEN phase) |
| Run full suite | ✅ Complete | All 255 tests passing, no regressions |
| Code review | ⬜ Pending | |

**Completion Date:** January 9, 2026

**Key Benefits:**
- ✅ **Automatic Recovery**: Transient TBR API failures recover automatically
- ✅ **Exponential Backoff**: Delays increase: 1s → 2s → 4s (capped at 10s)
- ✅ **Comprehensive Logging**: Retry attempts logged with transaction context
- ✅ **Reused Solution**: Leveraged H-12's withRetry utility (zero additional utility code)
- ✅ **Well-Tested**: 5 new integration tests (255 total tests passing)
- ✅ **No Regressions**: All existing tests still pass
- ✅ **Preserves C-5 Fix**: PENDING record still created before TBR call

**Configuration:**
- Max Retries: 3 (4 total attempts)
- Base Delay: 1000ms
- Max Delay: 10000ms (10 seconds)
- Backoff Pattern: Exponential (1s, 2s, 4s)

**Integration with C-5 (Orphaned TBR Claims Prevention):**
The retry logic works seamlessly with the C-5 fix:
1. PENDING transaction record created first (C-5)
2. TBR payment attempted with retries (H-13)
3. On success: Record updated to CREATED
4. On final failure: Record updated to FAILED with error details

---

### H-14: Payment Status Polling ✅ COMPLETED

**Status:** ✅ Completed (Jan 9, 2026)

**Problem:** The planning document indicated "Missing Payment Status Polling" but this was incorrect - the implementation already existed at [advert-payment.task.ts](apps/legal-gazette-api/src/modules/advert/tasks/payment/advert-payment.task.ts:1-169). The real issue was **missing test coverage** for this critical functionality.

**Solution:** Added comprehensive test coverage for the existing payment polling implementation.

**Files Changed:**
- Created: `apps/legal-gazette-api/src/modules/advert/tasks/payment/advert-payment.task.spec.ts` (15 tests)

**Existing Implementation Details:**
```typescript
// apps/legal-gazette-api/src/modules/advert/tasks/payment/advert-payment.task.ts
@Injectable()
export class AdvertPaymentTaskService {
  @Cron('*/15 * * * *') // Every 15 minutes
  async run() {
    // Uses distributed lock to prevent duplicate runs across containers
    await this.lock.runWithDistributedLock(
      TASK_JOB_IDS.payment,
      async () => {
        await this.updateTBRPayments()
      },
      { cooldownMs: 10 * 60 * 1000 } // 10 minute cooldown
    )
  }

  async updateTBRPayments() {
    // Query pending transactions
    const pendingTransactions = await this.tbrTransactionModel.findAll({
      where: {
        transactionType: 'ADVERT',
        chargeCategory: { [Op.eq]: process.env.LG_TBR_CHARGE_CATEGORY_PERSON },
        paidAt: { [Op.eq]: null },
        status: TBRTransactionStatus.CREATED,
      },
    })

    // Process in chunks (default 25, configurable via TBR_CHUNK_SIZE)
    const chunks = []
    for (let i = 0; i < pendingTransactions.length; i += this.chunkSize) {
      chunks.push(pendingTransactions.slice(i, i + this.chunkSize))
    }

    // Check each transaction with TBR service
    for (const chunk of chunks) {
      const promises = chunk.map((transaction) =>
        this.tbrService.getPaymentStatus({
          chargeBase: transaction.chargeBase,
          chargeCategory: transaction.chargeCategory,
          debtorNationalId: transaction.debtorNationalId,
        }),
      )
      const results = await Promise.allSettled(promises)

      // Update paid transactions
      for (const [i, result] of results.entries()) {
        if (result.status === 'fulfilled' && result.value.paid) {
          const transaction = chunk[i]
          transaction.status = TBRTransactionStatus.PAID
          transaction.paidAt = new Date()
          await transaction.save()
        }
      }

      // Wait 1 second between chunks to avoid overwhelming TBR service
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}
```

**Test Coverage (15 tests):**

1. **Core Functionality (4 tests)**
   - Skip job when no pending transactions
   - Update transaction when payment completed
   - Don't update when payment still pending
   - Process multiple transactions in single chunk

2. **Error Handling (3 tests)**
   - Log error and continue when TBR service fails
   - Handle payment canceled status
   - Continue processing despite errors

3. **Chunking Behavior (2 tests)**
   - Process in configurable chunk sizes
   - Respect TBR_CHUNK_SIZE environment variable

4. **Distributed Lock Integration (2 tests)**
   - Execute when lock acquired
   - Skip when lock unavailable

5. **Query Filtering (2 tests)**
   - Only query ADVERT + CREATED status
   - Filter by charge category from environment

6. **Logging (2 tests)**
   - Log job start/finish with duration
   - Log each chunk processed

**Status Table:**

| Step | Status | Notes |
|------|--------|-------|
| Discovered existing implementation | ✅ Complete | Implementation already exists and is production-ready |
| Write comprehensive test coverage | ✅ Complete | 15 tests covering all functionality |
| Verify tests pass | ✅ Complete | All 15 tests passing |
| Run full suite | ✅ Complete | All 245 tests passing, no regressions |
| Code review | ⬜ Pending | |

**Completion Date:** January 9, 2026

**Key Findings:**
- ✅ **Implementation Already Exists**: Fully functional payment polling task running every 15 minutes
- ✅ **Distributed Locking**: Prevents duplicate runs across containers with 10-minute cooldown
- ✅ **Chunked Processing**: Processes in configurable chunks (default 25) to avoid overwhelming TBR
- ✅ **Graceful Error Handling**: Uses Promise.allSettled to continue on failures
- ✅ **Proper Logging**: Comprehensive logging for monitoring and debugging
- ✅ **Now Well-Tested**: 15 comprehensive tests ensure reliability

---

### H-15: External API Timeout Configuration ✅ COMPLETED

**Status:** ✅ Completed (Jan 8, 2026)

**Problem:** External API calls lacked request timeouts, which could lead to hanging requests and service degradation.

**Solution:** Created centralized `fetchWithTimeout()` utility in `@dmr.is/utils` with 10-second default timeout.

**Files Modified:**

- ✅ `libs/shared/utils/src/index.ts` - Export httpUtils
- ✅ `apps/legal-gazette-api/src/modules/tbr/tbr.service.ts` - Use `fetchWithTimeout`
- ✅ `libs/clients/national-registry/national-registry.service.ts` - Use `fetchWithTimeout` (2 calls)
- ✅ `libs/clients/company-registry/company-regsitry.service.ts` - Use `fetchWithTimeout` (1 call)

**Files Created:**
- ✅ `libs/shared/utils/src/lib/httpUtils.ts` - New `fetchWithTimeout()` utility

**Status:**

| Step | Status | Notes |
|------|--------|-------|
| Create fetchWithTimeout utility | ✅ Complete | 10-second default timeout |
| Apply to TBR service | ✅ Complete | 1 call updated |
| Apply to National Registry | ✅ Complete | 2 calls updated |
| Apply to Company Registry | ✅ Complete | 1 call updated |
| Code review | ⬜ Pending | |

**Completion Date:** January 8, 2026

**Verification (Jan 9, 2026):** Confirmed all external API calls now use `fetchWithTimeout` with proper timeout configuration.

**Implementation:**

```typescript
// libs/shared/utils/src/lib/httpUtils.ts
export async function fetchWithTimeout(
  url: string | URL | Request,
  options?: RequestInit,
  timeoutMs = 10000,
): Promise<Response> {
  return fetch(url, {
    ...options,
    signal: AbortSignal.timeout(timeoutMs),
  })
}

// Usage in services:
import { fetchWithTimeout } from '@dmr.is/utils'

const response = await fetchWithTimeout(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})
```

**Benefits:**
- ✅ Centralized timeout configuration (DRY principle)
- ✅ All external API calls protected against hanging requests
- ✅ Reusable across entire monorepo
- ✅ No regressions introduced

**Completion Date:** January 8, 2026

**Verification (Jan 9, 2026):** ✅ Confirmed all external API calls (`national-registry.service.ts`, `tbr.service.ts`, `company-registry.service.ts`) now use `fetchWithTimeout` with proper timeout configuration.

---

### H-16: National Registry Token Refresh

#### Problem Statement

National Registry tokens expire but there's no proactive refresh mechanism. Current implementation has basic caching but no expiry tracking.

#### Current Implementation (Partial)

```typescript
// libs/clients/national-registry/national-registry.service.ts (lines 10-11, 47-49)
private audkenni: string | null = null
private token: string | null = null

private async authenticate() {
  if (this.token && this.audkenni) {
    return  // Early return if token exists - NO EXPIRY CHECK
  }
  // ... authenticate with API
}
```

**What's Missing:**
- ❌ No token expiry timestamp tracking
- ❌ No automatic refresh before expiry
- ❌ Tokens expire but system only authenticates on 401 errors

#### Proposed Solution

```typescript
@Injectable()
export class NationalRegistryService {
  private token: string | null = null
  private audkenni: string | null = null
  private tokenExpiresAt: Date | null = null
  
  private async authenticate() {
    // Check if token exists AND hasn't expired (with 5 min buffer)
    const bufferMs = 5 * 60 * 1000
    if (this.token && this.tokenExpiresAt && this.tokenExpiresAt.getTime() - Date.now() > bufferMs) {
      return
    }
    
    // Authenticate and store expiry
    const response = await fetchWithTimeout(...)
    const data = await response.json()
    this.token = data.accessToken
    this.audkenni = data.audkenni
    // REQUIRES: API documentation to determine token lifetime
    this.tokenExpiresAt = new Date(Date.now() + (data.expiresIn ?? 3600) * 1000)
  }
}
```

#### Status

| Step | Status | Notes |
|------|--------|-------|
| Basic token caching | ✅ Complete | Already implemented (lines 10-11, 47-49) |
| Add expiry tracking | ⬜ Not Started | Requires API documentation for token lifetime |
| Implement refresh logic | ⬜ Not Started | Needs expiry timestamp |
| Test token refresh | ⬜ Not Started | |
| Code review | ⬜ Not Started | |

**Findings (Jan 9, 2026):**
- ✅ Basic caching exists (token and audkenni cached in memory)
- ✅ Early return on cached token prevents unnecessary API calls
- ❌ No expiry timestamp tracking
- ❌ No proactive refresh before expiry
- **Blocker**: Need API documentation to determine token lifetime (`expiresIn` field in response?)
- **Priority**: Post-release (low urgency if tokens are long-lived or 401 handling is sufficient)

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
| Jan 8, 2026 | H-7 Delete Prevention | ✅ Complete | Published version protection + M-2 fix (6 tests, 203 total passing) |
| Jan 8, 2026 | H-8/H-9 State Machine | ✅ Complete | Status validation guards (7 tests, 210 total passing) |
| Jan 8, 2026 | H-4 XSS Prevention | ✅ Complete | HTML escaping utility + foreclosure service (29 tests, 218 total passing) |
| Jan 8, 2026 | H-10 Transaction Safety | ✅ Complete | Verification tests only - existing code already correct (10 tests, 228 total passing) |
| Jan 8, 2026 | H-17 Payment Validation | ✅ Complete | Payment before publish validation (4 tests, 232 total passing) |
| Jan 9, 2026 | H-14 Payment Polling | ✅ Complete | Test coverage for existing implementation (15 tests, 245 total passing) |
| Jan 9, 2026 | H-12 PDF Retry | ✅ Complete | withRetry utility + PDF retry logic (21 tests, 250 total passing) |
| Jan 9, 2026 | H-13 TBR Retry | ✅ Complete | Reused withRetry from H-12 (5 tests, 255 total passing) |
| Jan 9, 2026 | H-15 Timeout Config | ✅ Complete | Verified fetchWithTimeout in all external services |
| Jan 9, 2026 | H-11 FK Constraints | 🟡 Audit Complete | Some FKs have ON DELETE, migration needed for remaining |
| Jan 9, 2026 | H-16 Token Refresh | 🟡 Partial | Basic caching exists, needs expiry tracking (post-release) |

---

## Open Questions

1. ~~**H-2**: Should delegated users (actor) have access to applications created by the person they represent?~~ **RESOLVED:** Guard checks user.nationalId against applicantNationalId, admin scope bypasses check
2. **H-3**: What rate limits are appropriate? 10/min? 100/hour?
3. **H-4**: Should we use DOMPurify (more thorough) or simple escaping (lighter)?
4. **H-5**: Should we implement auto-masking in the logger, or require explicit masking calls?
5. **H-11**: What's the correct ON DELETE behavior for each FK? Cascade vs Set Null?
6. **H-12/H-13**: How many retries? What's acceptable delay?
7. **H-14**: How often should we poll TBR for payment status?
8. **H-17**: Which categories are payment-exempt? (Government, Court, Ministry, Free?) Should this be configurable?

---

**Document Owner:** Development Team  
**Last Updated:** January 7, 2026  
**Next Review:** Before implementation of each phase
