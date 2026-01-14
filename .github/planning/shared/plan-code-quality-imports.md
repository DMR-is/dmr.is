# Code Quality: Inefficient Imports & Unused Code Analysis

**Created**: January 12, 2026
**Status**: Research Complete - Awaiting Implementation

---

## Executive Summary

This document outlines findings from an analysis of the DMR.is monorepo for inefficient code imports and unused codepaths. The analysis identified several categories of issues that, when addressed, will improve build times, reduce bundle sizes, and improve code maintainability.

---

## Findings by Category

### 1. Full Lodash Import Instead of Specific Functions

**Severity**: 🔴 High (Bundle Size Impact)
**Impact**: Importing entire lodash library adds ~70KB to bundle

**Location**:
- [ApplicationFooter.tsx](../../../apps/legal-gazette-application-web/src/components/application/footer/ApplicationFooter.tsx#L1)

**Problem**:
```typescript
import _ from 'lodash'  // ❌ Imports entire library
```

**Recommended Fix**:
```typescript
import get from 'lodash/get'  // ✅ Only imports what's needed
import isEmpty from 'lodash/isEmpty'
```

**Files to Update**:
| File | Current Import | Should Import |
|------|---------------|---------------|
| `legal-gazette-application-web/.../ApplicationFooter.tsx` | `import _ from 'lodash'` | Specific functions only |

---

### 2. Unused/Deprecated Controllers (Dead Code)

**Severity**: 🟡 Medium (Maintenance Overhead)
**Impact**: Controllers registered but not called by any tRPC router

**Locations**:
- [case.controller.ts](../../../apps/legal-gazette-api/src/modules/case/case.controller.ts#L25)
- [fee-code.controller.ts](../../../apps/legal-gazette-api/src/modules/fee-code/fee-code.controller.ts#L12)
- [type-categories.controller.ts](../../../apps/legal-gazette-api/src/modules/type-categories/type-categories.controller.ts#L18)

**Details**:
These controllers are marked with `// TODO: Determine usage - currently no tRPC routers call this controller`. They are registered in NestJS but no frontend code calls them.

**Options**:
1. **Remove**: If functionality is truly unused
2. **Document**: If intended for future use
3. **Integrate**: Connect to tRPC routers if needed

---

### 3. Deprecated Method Still in Use

**Severity**: 🟡 Medium (Technical Debt)
**Impact**: Deprecated `runWithSessionLock` is still being used

**Location**:
- [lock.service.ts](../../../apps/legal-gazette-api/src/modules/advert/tasks/lock.service.ts#L180) - Defines deprecated method
- [publishing.task.ts](../../../apps/legal-gazette-api/src/modules/advert/tasks/publishing/publishing.task.ts#L76) - Uses deprecated method

**Problem**:
```typescript
/**
 * @deprecated Use runWithDistributedLock instead for better duplicate prevention.
 */
async runWithSessionLock(lockKey: number, fn: () => Promise<void>) { ... }
```

**Recommended Fix**:
Migrate `publishing.task.ts` to use `runWithDistributedLock` instead.

---

### 4. Unnecessary Default React Import

**Severity**: 🟢 Low (Code Style)
**Impact**: Unnecessary import since React 17+ with new JSX transform

**Files**:
```
apps/official-journal-web/src/pages/yfirskrifa-pdf/[...uid].tsx
apps/official-journal-web/src/components/attachments/Attachments.tsx
apps/official-journal-web/src/components/cards/CaseCard.tsx
apps/legal-gazette-web/src/components/users/UsersTable.tsx
apps/legal-gazette-web/src/components/status-tag/StatusTag.tsx
apps/legal-gazette-web/src/components/Form/AdvertFormAccordion.tsx
apps/legal-gazette-web/src/components/buttons/SettingsButton.tsx
libs/shared/dmr-ui/src/lib/components/Drawer/Drawer.tsx
libs/shared/dmr-ui/src/lib/components/Tag/Tag.tsx
libs/shared/dmr-ui/src/lib/island-is/lib/ToastContainer.tsx
```

**Problem**:
```typescript
import React from 'react'  // ❌ Unnecessary with new JSX transform
```

**Recommended Fix**:
```typescript
// Just use named imports as needed
import { useState, useEffect } from 'react'
```

---

### 5. Console.log Usage Instead of Logger

**Severity**: 🟡 Medium (Logging/PII Compliance)
**Impact**: Direct console usage bypasses structured logging and PII masking

**Affected Apps**:
| Application | Issue Count |
|------------|-------------|
| `regulations-api` | 15+ instances |
| `official-journal-api-export` | 5+ instances |
| `official-journal-web` | 4 instances |
| `legal-gazette-web` | 2 instances |
| `legal-gazette-application-web` | 1 instance |

**Problem**:
```typescript
console.error('Error in IntlProvider', { exception: err })  // ❌ No PII masking
```

**Recommended Fix**:
```typescript
import { getLogger } from '@dmr.is/logging-next'  // For Next.js apps
const logger = getLogger('IntlProvider')
logger.error('Error in IntlProvider', { exception: err })  // ✅ PII masked
```

---

### 6. Inconsistent date-fns Import Patterns

**Severity**: 🟢 Low (Consistency)
**Impact**: Mixed import styles create confusion

**Mixed Patterns Found**:
```typescript
// Pattern A - subpath imports (preferred for tree-shaking)
import addDays from 'date-fns/addDays'
import format from 'date-fns/format'

// Pattern B - named imports from main package
import { addYears, addDays } from 'date-fns'
```

**Files with Mixed Patterns**:
- `legal-gazette-application-web/src/components/form/recall/fields/PublishingFields.tsx`
- `legal-gazette-application-web/src/components/form/common/fields/PublishingFields.tsx`
- `legal-gazette-application-web/src/components/adverts/CreateDivisionEnding.tsx`

**Recommendation**:
Standardize on subpath imports (`date-fns/functionName`) for optimal tree-shaking.

---

### 7. ESLint Disable Comments

**Severity**: 🟢 Low (Code Quality)
**Impact**: Suppressed linting issues may indicate code problems

**Common Suppressions**:
| Pattern | Count | Common in |
|---------|-------|-----------|
| `@typescript-eslint/no-explicit-any` | 5+ | index.d.ts files, API handlers |
| `no-console` | 10+ | Server apps, layouts |
| `@typescript-eslint/no-non-null-assertion` | 2 | Auth options, export scripts |

**Files with File-Level Disables**:
- `official-journal-api-export/src/lib/db.ts` - `/* eslint-disable @typescript-eslint/no-explicit-any */`
- `regulations-api/src/db/Regulation.ts` - `/* eslint-disable no-console */`
- `regulations-api/src/server.ts` - `/* eslint-disable no-console */`

---

### 8. TODO Comments Indicating Incomplete Work

**Severity**: 🟡 Medium (Technical Debt)
**Impact**: Indicates work that was planned but not completed

**Categories of TODOs**:

| Category | Count | Example |
|----------|-------|---------|
| Remove/cleanup | 3 | `Remove PUBLISHED_CASE_ADVERTS table` |
| URL updates for prod | 2 | `Replace legal-gazette.dev URL's with prod URL's` |
| Feature additions | 5+ | `Add hypante`, `Add tests` |
| Monitoring | 1 | `Integrate to datadog alert/slack notification` |

**High Priority TODOs**:
1. [Footer.tsx](../../../libs/shared/dmr-ui/src/lib/components/Footer/Footer.tsx#L49) - URL replacement for prod
2. [LandingPage.tsx](../../../apps/legal-gazette-public-web/src/components/client-components/landing-page/LandingPage.tsx#L30) - URL replacement for prod
3. [case.service.ts](../../../libs/shared/modules/src/case/case.service.ts#L451) - Table cleanup

---

### 9. Barrel File Re-exports

**Severity**: 🟢 Low (Build Performance)
**Impact**: Deep barrel file chains can slow compilation and affect tree-shaking

**Pattern Observed**:
```
libs/shared/modules/src/index.ts
├── export * from './auth/auth.module'
├── export * from './journal'
├── export * from './journal/models'
├── export * from './signature'
└── ... (20+ re-exports)
```

**Concern**: 
- Importing from `@dmr.is/modules` pulls in re-export resolution for all 20+ modules
- Some consumers only need one or two modules

**Recommendation**:
Consider offering direct path imports for commonly used modules:
```typescript
// Instead of
import { CaseService } from '@dmr.is/modules'
// Allow
import { CaseService } from '@dmr.is/modules/case'
```

---

### 10. Duplicate Functionality

**Severity**: 🟢 Low (DRY Principle)
**Impact**: Same functionality implemented in multiple places

**Example - formatDate**:
1. `@dmr.is/utils` exports `formatDate`
2. `@dmr.is/utils/client` exports `formatDate` (different signature)
3. `apps/legal-gazette-application-web/src/lib/utils.ts` has its own `formatDate`

**Recommendation**:
Consolidate date formatting utilities into one shared location.

---

## Implementation Plan

### Phase 1: Quick Wins (1-2 days)
**Goal**: Fix high-impact, low-effort issues

| Task | Priority | Effort | Files |
|------|----------|--------|-------|
| Fix full lodash import | High | 15 min | 1 file |
| Add ESLint rule to prevent `import _ from 'lodash'` | High | 30 min | eslint config |
| Replace deprecated `runWithSessionLock` usage | Medium | 1 hour | 1 file |

### Phase 2: Console Cleanup (2-3 days)
**Goal**: Replace console.* with proper loggers

| App | Action |
|-----|--------|
| `regulations-api` | Replace with `@dmr.is/logging` |
| `official-journal-api-export` | Replace with `@dmr.is/logging` |
| Next.js apps | Replace with `@dmr.is/logging-next` |

### Phase 3: Dead Code Removal (3-5 days)
**Goal**: Remove or document unused code

| Task | Action |
|------|--------|
| Unused controllers | Verify no external usage, document or remove |
| Clean up TODOs | Address or convert to GitHub issues |
| Remove unnecessary React imports | Automated codemod |

### Phase 4: Import Optimization (5+ days)
**Goal**: Standardize import patterns

| Task | Action |
|------|--------|
| date-fns imports | Standardize on subpath imports |
| Consider selective exports | Evaluate `@dmr.is/modules` barrel file performance |
| Consolidate duplicate utilities | Merge formatDate implementations |

---

## ESLint Rule Additions

Consider adding these ESLint rules:

```javascript
// eslint-local-rules.js additions

// 1. Prevent full lodash import
'no-restricted-imports': ['error', {
  paths: [{
    name: 'lodash',
    message: 'Import specific lodash functions instead: import debounce from "lodash/debounce"'
  }]
}],

// 2. Encourage @dmr.is/logging over console
'no-console': ['warn', { allow: ['warn', 'error'] }],
```

---

## Verification Checklist

After implementation, verify:

- [ ] Bundle size decreased (check with `nx build <app> --analyze`)
- [ ] No new TypeScript errors
- [ ] All tests pass
- [ ] No runtime regressions
- [ ] ESLint passes with new rules

---

## Status Tracking

| Phase | Status | Completed By | Notes |
|-------|--------|--------------|-------|
| Phase 1 | ⬜ Not Started | - | - |
| Phase 2 | ⬜ Not Started | - | - |
| Phase 3 | ⬜ Not Started | - | - |
| Phase 4 | ⬜ Not Started | - | - |

---

## Related Documents

- [copilot-instructions.md](../../copilot-instructions.md) - Logging best practices
- [nextjs-architecture-guide.md](../../nextjs-architecture-guide.md) - Import patterns

