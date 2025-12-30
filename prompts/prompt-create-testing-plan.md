# Prompt: Create Manual Testing Plan for Legal Gazette

## Purpose

Generate a comprehensive manual testing plan for the Legal Gazette system to be executed before production release. The testing plan should cover all critical paths across the three web applications and their shared API.

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

## User Types & Access Patterns

### legal-gazette-web (Editor/Admin)
- **Authentication**: Island.is login
- **Authorization**: User must exist in `UserModel` table (admin lookup)
- **Key flows**: Review applications, manage adverts, publish to issues

### legal-gazette-application-web (Applicants)
- **Authentication**: Island.is login
- **Authorization**: Any authenticated user can access
- **Key flows**: Create applications, submit for review, track status, recall/withdraw

### legal-gazette-public-web (Subscribers)
- **Authentication**: Island.is login
- **Authorization**: Must have active subscription (`isActive=true`, `subscribedTo > now`)
- **Key flows**: Purchase subscription, browse/search adverts, view advert details
- **Public pages**: About, fee schedule, terms (accessible without login)

### External Systems (Machine Clients)
- **Authentication**: JWT with machine client credentials
- **Authorization**: `MachineClientGuard`
- **Key flows**: Foreclosure sales creation/deletion, automated advert posting

---

## Critical Business Flows to Test

### 1. Subscription Purchase & Renewal
- New user purchases subscription → TBR payment created → subscriber activated
- Expired subscriber renews → `subscribedTo` extended, `subscribedFrom` preserved
- Payment failure handling → subscriber not activated, clean state
- Subscription expiry check → access blocked when expired

### 2. Application Lifecycle
- Create draft application → save progress → submit for review
- Application validation → required fields, format validation
- Recall/withdraw submitted application
- View application history and status

### 3. Editorial Workflow
- View submitted applications queue
- Approve application → creates advert
- Reject application → notification sent
- Edit advert content
- Schedule for publication (assign to issue, set date)

### 4. Publication Flow
- Publish advert → TBR payment created → email notification → PDF generated
- Advert versioning (A, B, C versions)
- Issue management (group adverts by publication date)

### 5. External Integrations
- Foreclosure sale creation via API
- Island.is application submission
- Machine client authentication

### 6. Public Access
- Subscriber browses published adverts
- Search and filter functionality
- View advert details and download PDF
- Category navigation

---

## Areas Requiring Test Coverage

### Authentication & Authorization
- [ ] Login/logout flows for each application
- [ ] Admin access control (legal-gazette-web)
- [ ] Subscription-based access (legal-gazette-public-web)
- [ ] Delegation support across applications
- [ ] Session expiry and refresh
- [ ] Unauthorized access attempts blocked

### Payment Integration (TBR)
- [ ] Subscription payment creation
- [ ] Advert publication payment
- [ ] Payment failure scenarios
- [ ] Correct fee codes and amounts
- [ ] Transaction logging/audit

### Data Validation
- [ ] Form field validation (required, format, length)
- [ ] National ID (kennitala) validation
- [ ] Email format validation
- [ ] Date/time handling

### Error Handling
- [ ] Network errors
- [ ] API errors
- [ ] 404 pages
- [ ] Session expiry during action
- [ ] Invalid URL parameters

### Performance
- [ ] Page load times
- [ ] Large dataset handling
- [ ] Pagination functionality

---

## Output Requirements

Generate a testing plan document that includes:

### 1. Prerequisites Section
- Environment requirements
- Test account matrix (user types with national IDs)
- Application URLs
- External system sandbox configuration

### 2. Test Cases
For each test case, include:
- **ID**: Unique identifier (e.g., TC-1.1)
- **Title**: Brief description
- **Priority**: Critical / High / Medium / Low
- **Preconditions**: Setup required before test
- **Steps**: Numbered step-by-step actions
- **Expected Results**: What should happen at each step
- **Pass/Fail checkbox**: For recording results
- **Notes section**: For recording issues

### 3. Test Modules
Organize test cases by module:
1. Authentication & Authorization
2. Subscription Flow
3. Application Submission
4. Editor Workflow
5. Publication Flow
6. External Integrations
7. Public Advert Viewing
8. Error Handling & Edge Cases
9. Performance

### 4. Testing Schedule
- Suggested timeline for 2-week testing period
- Which modules to test each day
- Time for regression testing and bug fixes

### 5. Bug Reporting Template
- Standard format for reporting issues found
- Severity levels
- Required information

### 6. Sign-Off Criteria
- What must pass before production release
- Who needs to approve

---

## Reference Materials

Consult these files for detailed implementation understanding:

### API Structure
- `apps/legal-gazette-api/src/modules/` - All API modules
- `apps/legal-gazette-api/src/core/guards/` - Authorization guards
- `apps/legal-gazette-api/src/models/` - Data models

### Frontend Structure
- `apps/legal-gazette-web/src/app/` - Editor app routes
- `apps/legal-gazette-application-web/src/app/` - Application submission routes
- `apps/legal-gazette-public-web/src/app/` - Public web routes

### Authentication
- `apps/*/src/middleware.ts` - Auth middleware configuration
- `libs/shared/auth/` - Shared auth library

### Planning Documents
- `.github/planning/legal-gazette/` - Feature planning docs
- `.github/copilot-instructions.md` - Project conventions

---

## Special Considerations

### Icelandic Context
- All user-facing text is in Icelandic
- National IDs (kennitala) follow specific format
- Company vs personal national IDs have different patterns

### Delegation
- Users can act on behalf of others (individuals or companies)
- Delegation flows through Island.is
- Actions should be attributed correctly

### Payment Amounts
- Subscription fee: 4,500 ISK (configurable via `LG_SUBSCRIPTION_AMOUNT`)
- Advert fees: Calculated based on content/type

### Date/Time
- All dates in Icelandic timezone
- Business day considerations for publication scheduling

---

## Questions to Answer During Test Plan Creation

1. What are the exact test national IDs available in staging?
2. Is TBR sandbox fully configured and accessible?
3. Are there specific browser/device requirements?
4. What is the expected data volume in staging?
5. Are email notifications testable (SMTP configured)?
6. Is PDF generation service operational in staging?
7. What are the Island.is test environment URLs?
8. Are there any known issues to exclude from testing?

---

## Deliverable

A complete, executable manual testing plan document that the QA team can use to systematically verify all critical functionality before the production release scheduled in 2 weeks.
