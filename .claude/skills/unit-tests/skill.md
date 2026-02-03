---
description: Create Jest unit tests following established DMR.is patterns
allowed-tools: Write, Read, Glob, Grep, Edit
argument-hint: <file-path-to-test>
---

# Unit Tests Skill

Create Jest unit tests for services, controllers, guards, utilities, and event listeners following DMR.is monorepo conventions.

File to test: $ARGUMENTS

## Workflow

### 1. Analyze Source File

Read the source file and determine:

1. **File type**: Service, Controller, Guard, Utility, Event Listener
2. **Dependencies**: What needs to be mocked (services, models, etc.)
3. **Public methods**: What needs to be tested
4. **Edge cases**: Error conditions, validation, transactions

### 2. Select Test Pattern

| Type | Pattern | Key Features |
|------|---------|--------------|
| NestJS Service | `Test.createTestingModule()` | Model mocking, transaction simulation |
| NestJS Controller | `Test.createTestingModule()` | Guard testing, request/response mocks |
| NestJS Guard | Reflector mocking | ExecutionContext mocks, decorator reflection |
| Event Listener | Event mocking | Transaction simulation, service mocks |
| Utility Function | Direct testing | Edge cases, input validation |

### 3. Create Test File

**Location**: Same directory as source file
**Naming**: `{filename}.spec.ts`

Example:

```text
src/modules/advert/
├── advert.service.ts
└── advert.service.spec.ts   <-- Create here
```

### 4. Implementation Checklist

- [ ] Import dependencies and test utilities
- [ ] Create mock factories for test data
- [ ] Set up `beforeEach` with `Test.createTestingModule()`
- [ ] Mock all injected dependencies
- [ ] Group tests with descriptive `describe` blocks
- [ ] Write tests following AAA pattern (Arrange-Act-Assert)
- [ ] Include edge cases and error conditions
- [ ] Add `jest.clearAllMocks()` in `beforeEach`

### 5. Run Tests

```bash
yarn nx test <project> --testFile=<path/to/file.spec.ts>
```

## Common Imports

### NestJS Service/Controller Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/sequelize'
import { Sequelize } from 'sequelize-typescript'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { LOGGER_PROVIDER } from '@dmr.is/logging'
```

### Guard Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { Reflector } from '@nestjs/core'
import { ExecutionContext, ForbiddenException } from '@nestjs/common'
```

### Utility Tests

```typescript
// No special imports needed - direct Jest testing
```

## Quick Reference

See detailed info:

- **`references/patterns.md`** - Complete test patterns for each file type
- **`references/mocking.md`** - Mocking strategies for models, services, transactions
