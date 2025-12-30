# Code Review Prompt: Legal Gazette System

## Purpose

Perform a comprehensive code review of the Legal Gazette system to identify potential issues, anti-patterns, security vulnerabilities, and areas for improvement before production release.

---

## System Overview

Legal Gazette (Lögbirtingablaðið) is a government publication system consisting of:

### Applications
1. **legal-gazette-api** - NestJS backend API serving all frontends
2. **legal-gazette-web** - Editor/admin interface (Next.js App Router)
3. **legal-gazette-application-web** - Public application submission (Next.js App Router)
4. **legal-gazette-public-web** - Subscriber-facing public website (Next.js App Router)

### Key Integrations
- **Island.is Authentication** - SSO authentication with delegation support
- **TBR (Tollur og Bókhald Ríkisins)** - Government payment/billing system
- **X-Road** - Government data exchange layer
- **National Registry** - Icelandic national ID verification

---

## Review Areas

### 1. Authentication & Authorization

**Files to Review:**
- `apps/legal-gazette-api/src/core/guards/authorization.guard.ts`
- `apps/legal-gazette-api/src/core/guards/machine-client.guard.ts`
- `apps/legal-gazette-api/src/core/guards/current-submitte.guard.ts`
- `apps/legal-gazette-api/src/modules/users/`
- `apps/legal-gazette-web/src/middleware.ts`
- `apps/legal-gazette-application-web/src/middleware.ts`
- `apps/legal-gazette-public-web/src/middleware.ts`
- `libs/shared/auth/` (shared auth library)

**Questions to Answer:**
- Are all protected routes properly guarded?
- Is the admin lookup secure (prevents bypassing admin check)?
- Does delegation work correctly across all applications?
- Is there any inconsistency between middleware auth and API auth?
- Are machine client endpoints properly protected?
- Is session/token refresh handled correctly?
- Are scopes properly validated for each application type?

**Specific Concerns:**
- `@AdminAccess()` decorator logic - verify OR logic with scopes works correctly
- Middleware `checkIsActive` flag difference between apps (public-web: true, others: false)
- Token expiry and refresh handling in Next.js middleware

---

### 2. Payment & Subscription System (TBR Integration)

**Files to Review:**
- `apps/legal-gazette-api/src/modules/tbr/`
- `apps/legal-gazette-api/src/modules/subscribers/`
- `apps/legal-gazette-api/src/modules/subscribers/listeners/subscriber-created.listener.ts`
- `apps/legal-gazette-api/src/modules/advert/publications/listeners/advert-published.listener.ts`
- `apps/legal-gazette-api/src/modules/advert/calculator/`
- `.github/planning/legal-gazette/plan-tbr-subscription-payment.md`

**Questions to Answer:**
- Is the TBR payment creation atomic with database updates?
- What happens if TBR succeeds but DB fails? Is there proper error recovery?
- Are payment amounts configurable and validated?
- Is idempotency handled for payment retries?
- Are there proper audit logs for all payment operations?
- Is the subscription expiry check race-condition free?

**Specific Concerns:**
- Transaction boundaries in `subscriber-created.listener.ts` - TBR call is outside transaction
- Error handling when TBR API is unavailable
- Fee code and amount configuration via environment variables
- Subscription renewal vs. new subscription logic

---

### 3. Application Submission Flow

**Files to Review:**
- `apps/legal-gazette-api/src/modules/applications/`
- `apps/legal-gazette-api/src/modules/applications/recall/`
- `apps/legal-gazette-api/src/modules/applications-island-is/`
- `apps/legal-gazette-application-web/src/app/(protected)/(application-shell)/`
- Application state machine and status transitions

**Questions to Answer:**
- Can applications get stuck in invalid states?
- Is the recall/withdrawal flow complete and tested?
- Are Island.is application submissions properly validated?
- Is there proper ownership validation for application updates?
- Are draft applications cleaned up properly?
- Is concurrent editing handled (optimistic locking)?

**Specific Concerns:**
- Application state transitions - are all edge cases covered?
- Application ownership - can users access others' applications?
- Draft application TTL and cleanup

---

### 4. Advert Publishing Flow

**Files to Review:**
- `apps/legal-gazette-api/src/modules/advert/`
- `apps/legal-gazette-api/src/modules/advert/controllers/`
- `apps/legal-gazette-api/src/modules/advert/publications/`
- `apps/legal-gazette-api/src/modules/advert/issues/`
- `apps/legal-gazette-api/src/modules/advert/pdf/`
- `apps/legal-gazette-web/src/app/(protected)/ritstjorn/`

**Questions to Answer:**
- Is the publishing workflow atomic?
- Can adverts be published before payment is confirmed?
- Are PDF generations handled asynchronously and reliably?
- Is versioning (A, B, C versions) working correctly?
- Are issues (publication collections) managed correctly?
- Can published adverts be improperly modified?

**Specific Concerns:**
- Publication versioning logic
- PDF generation failures - are they retried?
- Issue date management and scheduling
- Advert status transitions

---

### 5. External System Integrations

**Files to Review:**
- `apps/legal-gazette-api/src/modules/external-systems/foreclosure/`
- `apps/legal-gazette-api/src/modules/external-systems/company/`
- `apps/legal-gazette-api/src/modules/national-registry/`
- Machine client authentication

**Questions to Answer:**
- Are external system endpoints properly secured?
- Is input validation sufficient for external data?
- Are timeouts and retries configured correctly?
- Is there proper rate limiting?
- Are external API failures handled gracefully?

**Specific Concerns:**
- Foreclosure API - automatic advert creation from external data
- Machine client guard - is it properly restrictive?
- X-Road integration reliability

---

### 6. Database & Data Integrity

**Files to Review:**
- `apps/legal-gazette-api/src/models/`
- `apps/legal-gazette-api/db/migrations/`
- Sequelize model definitions and relationships

**Questions to Answer:**
- Are all foreign key constraints properly defined?
- Is soft-delete (deletedAt) consistently used?
- Are database indexes optimized for common queries?
- Are transactions used where needed?
- Is data validation at model level sufficient?

**Specific Concerns:**
- Orphaned records when parent is deleted
- Unique constraints on appropriate fields
- Cascade delete behaviors

---

### 7. Error Handling & Logging

**Files to Review:**
- All service files for try-catch patterns
- `libs/logging/` and `libs/logging-next/`
- Exception filters and interceptors

**Questions to Answer:**
- Are all errors properly caught and logged?
- Is PII (national IDs) masked in logs?
- Are there appropriate log levels?
- Are errors returned to clients informative but not leaky?
- Is the correct logger used for each runtime (Edge vs Node)?

**Specific Concerns:**
- Using `@dmr.is/logging` in Next.js (Edge-incompatible) vs `@dmr.is/logging-next`
- Error stack traces in production logs
- Missing error handling in async operations

---

### 8. Frontend Patterns

**Files to Review:**
- All `page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx` files
- Container components in each app
- Form handling and validation
- tRPC client setup

**Questions to Answer:**
- Are Server vs Client Components correctly chosen?
- Is data fetching optimized (no waterfalls)?
- Are loading and error states properly handled?
- Is form validation consistent with backend?
- Are there memory leaks in client components?

**Specific Concerns:**
- Missing `'use client'` directives
- Props serialization between server/client
- Suspense boundary placement

---

### 9. Security Review

**Questions to Answer:**
- Is input validation sufficient on all endpoints?
- Are SQL injection risks mitigated (Sequelize parameterization)?
- Is XSS prevented in frontend rendering?
- Are CSRF protections in place?
- Is sensitive data properly encrypted at rest/in transit?
- Are environment variables properly secured?
- Is there any hardcoded sensitive data in code?

**Specific Concerns:**
- National ID handling and storage
- Payment information security
- Session token storage

---

### 10. Performance & Scalability

**Questions to Answer:**
- Are there N+1 query issues?
- Is caching implemented where appropriate?
- Are database queries optimized?
- Are there any blocking operations in critical paths?
- Is pagination properly implemented?

**Specific Concerns:**
- Large dataset handling in listings
- PDF generation performance
- TBR API call latency impact

---

## Output Format

For each issue found, provide:

```markdown
### Issue: [Brief Title]

**Severity:** Critical | High | Medium | Low
**Category:** Security | Performance | Reliability | Maintainability | Best Practice
**Location:** [File path and line numbers]

**Description:**
[Detailed explanation of the issue]

**Impact:**
[What could go wrong if not fixed]

**Recommendation:**
[How to fix the issue]

**Code Example (if applicable):**
```typescript
// Before
// After
```
```

---

## Priority Guidelines

- **Critical**: Security vulnerabilities, data loss risks, payment issues
- **High**: Functional bugs, auth bypasses, data integrity issues
- **Medium**: Performance issues, code quality, missing error handling
- **Low**: Code style, minor improvements, documentation

---

## Additional Context

Refer to these documents for project conventions:
- `.github/copilot-instructions.md` - Project overview and conventions
- `.github/nextjs-architecture-guide.md` - Next.js patterns
- `.github/planning/legal-gazette/` - Feature planning documents

The system is scheduled for production release in 2 weeks. Focus on issues that could cause production incidents.
