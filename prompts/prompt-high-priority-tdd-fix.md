# Prompt: High Priority Issues TDD Fix Agent

## Context

You are implementing fixes for high priority security and data integrity issues in the Legal Gazette API using Test-Driven Development (TDD).

**Reference Documents:**
- Planning document: `.github/planning/legal-gazette/plan-high-priority-issues-tdd-fix.md`
- Code review findings: `.github/planning/legal-gazette/plan-code-review-findings.md`
- Project conventions: `.github/copilot-instructions.md`

## Your Task

Work through **Phase 2** of the high priority issues plan, implementing one issue at a time using strict TDD methodology.

## TDD Workflow (MUST FOLLOW)

For each issue, follow these steps **in order**:

### Step 1: Understand the Issue
1. Read the issue description in the planning document
2. Locate the affected file(s) in the codebase
3. Review the current implementation to understand the vulnerability/bug
4. Summarize the issue and proposed fix to the user

### Step 2: Write Failing Tests (RED)
1. Create or update the test file for the affected service/controller
2. Write test cases that:
   - Demonstrate the current vulnerability/bug exists
   - Define the expected behavior after the fix
   - Cover edge cases and error scenarios
3. **STOP and ask the user**: "I've written the following tests for [Issue ID]. Please review them before I proceed with implementation."
4. Wait for user confirmation before continuing

### Step 3: Verify Tests Fail
1. Run the tests using: `nx test legal-gazette-api --testPathPattern="<test-file-pattern>"`
2. Confirm the tests fail as expected (proving the bug exists)
3. Report the test results to the user

### Step 4: Implement the Fix (GREEN)
1. Make the minimum changes necessary to make the tests pass
2. Follow the implementation guidance in the planning document
3. Ensure you follow project conventions from `.github/copilot-instructions.md`

### Step 5: Verify Tests Pass
1. Run the tests again
2. Confirm all tests pass
3. Run the full test suite to check for regressions: `nx test legal-gazette-api`
4. Report results to the user

### Step 6: Refactor (if needed)
1. Clean up any code duplication
2. Improve naming or structure if beneficial
3. Ensure tests still pass after refactoring

### Step 7: Update Planning Document (REQUIRED)
1. Mark the issue as complete in `.github/planning/legal-gazette/plan-high-priority-issues-tdd-fix.md`:
   - Update the status in the Phase 2 summary table (⬜ → ✅)
   - Update the issue's detailed Status table (mark steps as ✅ Complete)
   - Update the Progress Tracking table with completion date
2. Note any decisions made or deviations from the plan

### Step 8: Proceed to Next Issue
1. Ask the user: "Issue [ID] is complete. Should I proceed to the next issue [Next ID]: [Title]?"
2. Wait for confirmation before starting the next issue

---

## Current Phase: Phase 2 - H-2 Ownership Validation

### Issue: H-2 - Missing Ownership Validation on Recall Min Date Endpoints

**Location:** `apps/legal-gazette-api/src/modules/applications/recall/recall-application.controller.ts`

**Problem:** The recall min date endpoints allow any authenticated user to update recall dates for any advert, not just their own.

**Test File:** `apps/legal-gazette-api/src/modules/applications/recall/recall-application.controller.spec.ts`

**Test Cases to Write:**
```typescript
describe('RecallApplicationController - Ownership Validation (H-2)', () => {
  describe('setRecallMinDate', () => {
    it('should allow owner to set recall min date for their own advert')
    it('should throw ForbiddenException when non-owner tries to set recall min date')
    it('should allow admin to set recall min date for any advert')
  })

  describe('getRecallMinDate', () => {
    it('should allow owner to get recall min date for their own advert')
    it('should throw ForbiddenException when non-owner tries to get recall min date')
    it('should allow admin to get recall min date for any advert')
  })
})
```

**Implementation Notes:**
- Add ownership check in controller or service
- Check if `currentUser.nationalId === advert.createdByNationalId`
- Admin users bypass ownership check (use `@AdminAccess()` decorator pattern)
- Return 403 Forbidden for unauthorized access

---

## Important Rules

1. **NEVER skip the test-first approach** - Always write tests before implementation
2. **ALWAYS wait for user confirmation** after writing tests
3. **ONE issue at a time** - Complete each issue fully before moving to the next
4. **ALWAYS update the plan** - After completing each issue, update `.github/planning/legal-gazette/plan-high-priority-issues-tdd-fix.md` with:
   - ✅ status in summary tables
   - Completion notes in status table
   - Date and notes in progress tracking
5. **Run full test suite** - Ensure no regressions after each fix
6. **Follow project conventions** - Use the correct logger, import paths, etc.

## Commands Reference

```bash
# Run specific test file
nx test legal-gazette-api --testPathPattern="recall-application.controller.spec"

# Run all tests for legal-gazette-api
nx test legal-gazette-api

# Run tests with coverage
nx test legal-gazette-api --coverage

# Check for lint errors
nx lint legal-gazette-api
```

## Starting Point

Begin with **H-2: Missing Ownership Validation on Recall Min Date Endpoints**.

1. First, read the current implementation in `recall-application.controller.ts`
2. Check if there's an existing test file
3. Write the failing tests
4. Present them to the user for review

**Start now by examining the recall-application.controller.ts file and understanding the current implementation.**
