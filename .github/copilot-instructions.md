# DMR.is Monorepo - GitHub Copilot Instructions

> **📚 Specialized Documentation**  
> This file provides quick reference and critical conventions. For detailed patterns:
> - **Next.js Architecture** (App Router, Server/Client Components, routing): [nextjs-architecture-guide.md](./nextjs-architecture-guide.md)
> - **Documentation Guide** (how to use these files): [README-documentation.md](./README-documentation.md)

## Planning-First Workflow

**IMPORTANT**: For new features, multi-file changes, or complex tasks, always follow the planning-first approach:

### When to Create a Planning File

Before making multiple changes, **ask the user** if they want to create a planning file first when:
- Implementing a new feature that spans multiple files
- Making architectural changes
- Refactoring existing code across modules
- Adding new database migrations or models
- Creating new API endpoints with corresponding frontend changes

### Planning File Process

1. **Ask First**: "This looks like a multi-step task. Would you like me to create a planning file first in `.github/planning/<product>/` before implementing?"

2. **Create Planning File**: If approved, create a detailed plan at `.github/planning/<product>/plan-<feature-name>.md` including:
   - Summary of the task
   - Implementation phases
   - Files to create/modify
   - Database changes (if any)
   - Security considerations
   - Testing checklist
   - Status tracking table

3. **Summarize and Confirm**: After creating the planning file, provide a brief summary of:
   - Key phases and their scope
   - Number of files to be created/modified
   - Any open questions or decisions needed
   - Then ask: "Should I proceed with implementation?"

4. **Update During Implementation**: Keep the planning file updated with progress (mark phases complete, note decisions made)

### Planning Folder Structure

```
.github/planning/
├── legal-gazette/           # Legal Gazette product plans
├── ojoi/                    # Official Journal product plans
└── shared/                  # Cross-product plans
```

### Example Planning File Reference

See [plan-legacy-subscriber-migration.md](./planning/legal-gazette/plan-legacy-subscriber-migration.md) for a well-structured planning document.

---

## Project Overview

This is an **Nx monorepo** managing multiple applications for Iceland's DMR (Dómsmálaráðuneytið - Ministry of Justice). It includes systems for official publications, legal gazettes, and regulations.

### Technology Stack

- **Monorepo Tool**: Nx
- **Backend**: NestJS with Sequelize ORM and PostgreSQL
- **Frontend**: Next.js (mix of Pages Router and App Router)
- **Styling**: Vanilla Extract CSS-in-JS
- **UI Library**: Island.is UI components (via git submodules)
- **Type-Safe APIs**: tRPC (newer apps), OpenAPI-generated clients (older apps)
- **Authentication**: NextAuth.js (session-based), JWT for APIs
- **State Management**: Tanstack Query (React Query), Zustand
- **Forms**: React Hook Form with Zod validation
- **Package Manager**: Yarn 4.7.0 (npm is disabled)
- **Node Version**: 20.15.0

## Architecture

### Product Families

1. **Official Journal (Stjórnartíðindi)** - `official-journal-*`
   - `official-journal-api` - Main backend API
   - `official-journal-admin-api` - Admin-specific API
   - `official-journal-application-api` - Application submission API
   - `official-journal-web` - Public web frontend (Pages Router)
   - `official-journal-api-export` - Export service

2. **Legal Gazette (Lögbirtingablað)** - `legal-gazette-*`
   - `legal-gazette-api` - Backend API
   - `legal-gazette-web` - Main web application (App Router)
   - `legal-gazette-application-web` - Application submission frontend (App Router)
   - `legal-gazette-public-web` - Public-facing website (App Router)

3. **Regulations (Reglugerðir)** - `regulations-api`
   - Fastify-based API with temporal versioning

### Shared Libraries Structure

Libraries are organized under `libs/` and imported via TypeScript path aliases:

- `@dmr.is/modules` - Reusable NestJS modules (auth, case, journal, etc.)
- `@dmr.is/db` - Sequelize configuration
- `@dmr.is/auth` - Authentication guards and strategies
- `@dmr.is/logging` - **Winston logger for NestJS APIs** (Node.js only)
- `@dmr.is/logging-next` - **Lightweight logger for Next.js** (Edge Runtime compatible)
- `@dmr.is/apm` - Datadog APM setup
- `@dmr.is/utils` - Shared utilities
- `@dmr.is/constants` - Shared constants
- `@dmr.is/shared/dto` - Data transfer objects
- `@dmr.is/shared/filters` - NestJS exception filters
- `@dmr.is/shared/interceptors` - NestJS interceptors
- `@dmr.is/shared/middleware` - Custom middleware
- `@dmr.is/pipelines` - Validation pipes
- `@dmr.is/decorators` - Custom decorators
- `@dmr.is/ui/components/*` - Shared React components
- `@dmr.is/trpc/client/*` - tRPC client utilities
- `@island.is/island-ui/*` - UI components from submodules

## Critical Conventions

### Logging Best Practices

**IMPORTANT**: Use the correct logger for each runtime environment:

#### For NestJS APIs (Node.js Runtime)

```typescript
import { getLogger } from '@dmr.is/logging'

const logger = getLogger('ServiceName')
logger.info('Processing request', { metadata })
logger.error('Error occurred', { error: err.message })
```

**Features**:
- Winston-based with file transports
- Full NestJS integration
- Custom transports support
- Exception and rejection handling

#### For Next.js Applications (Edge Runtime Compatible)

```typescript
import { getLogger } from '@dmr.is/logging-next'

const logger = getLogger('ComponentName')
logger.info('Token refreshed', { metadata })
logger.error('Validation failed', { error })
```

**Features**:
- Zero dependencies (Edge Runtime compatible)
- Works in middleware, API routes, and server components
- JSON logging in production
- PII masking (national IDs)
- Same API as `@dmr.is/logging`

**ESLint Enforcement**:
- Legal Gazette Next.js apps have ESLint rules preventing `@dmr.is/logging` imports
- NestJS APIs should prevent `@dmr.is/logging-next` imports (recommended)
- Official Journal Web currently uses `@dmr.is/logging` (works in Node.js runtime)

**Where Each Logger Is Used**:
| Context | Logger | Reason |
|---------|--------|--------|
| NestJS services/controllers | `@dmr.is/logging` | Full Winston features, file logging |
| Next.js middleware | `@dmr.is/logging-next` | Edge Runtime compatible |
| NextAuth callbacks | `@dmr.is/logging-next` | May run in Edge Runtime |
| Server Components | `@dmr.is/logging-next` | Universal compatibility |
| Shared auth library | `@dmr.is/logging-next` | Used by both NestJS and Next.js |

**Never use `console.log` directly** - always use the appropriate logger.

### Import Path Aliases

**Always use TypeScript path aliases** defined in `tsconfig.base.json`:

```typescript
// ✅ Correct
import { LogMethod } from '@dmr.is/decorators'
import { CaseService } from '@dmr.is/modules'
import { Box, Stack } from '@island.is/island-ui/core'

// ❌ Wrong
import { LogMethod } from '../../../libs/shared/decorators'
```

### Import Ordering

Enforced by `eslint-plugin-simple-import-sort`:

1. Next.js imports (`next/*`)
2. External packages
3. NestJS packages (`@nestjs/*`)
4. DMR.is packages (`@dmr.is/*`)
5. Island.is packages (`@island.is/*`)
6. Relative imports (`../`, `./`)

Run `nx lint <project> --fix` to auto-fix import order.

### Custom ESLint Rules

Located in `eslint-local-rules.js`:

1. **`require-reduce-defaults`**: Always provide initial value to `.reduce()`
2. **`disallow-kennitalas`**: No real Icelandic SSNs in code (prevents PII leaks)
3. **`no-async-module-init`**: No async in NestJS `register`, `forRoot`, etc. (causes startup failures)

### NestJS Module Pattern

Two-module pattern for separation of concerns:

```typescript
// *.provider.module.ts - Service providers, imports, models
@Module({
  imports: [SequelizeModule.forFeature([CaseModel])],
  providers: [CaseService],
  exports: [CaseService],
})
export class CaseProviderModule {}

// *.controller.module.ts - Controllers, guards, minimal imports
@Module({
  imports: [CaseProviderModule],
  controllers: [CaseController],
})
export class CaseControllerModule {}
```

### Authorization Guards (Legal Gazette API)

The Legal Gazette API uses `AuthorizationGuard` to handle both scope-based and admin-based access control in a single guard.

**Authorization Logic Matrix:**

| Decorators | User Lookup? | Access Logic |
|------------|--------------|--------------|
| None | ❌ No | Allow (auth only) |
| `@Scopes()` only | ❌ No | Check scope in JWT |
| `@AdminAccess()` only | ✅ Yes | Check user in UserModel |
| `@AdminAccess()` + `@Scopes()` | ✅ Yes | Admin OR scope (OR logic) |

**Available Decorators:**

```typescript
// Scope decorators (from @dmr.is/modules/guards/auth)
@PublicWebScopes()           // Requires '@logbirtingablad.is/logbirtingabladid' scope
@ApplicationWebScopes()      // Requires '@logbirtingablad.is/lg-application-web' scope
@PublicOrApplicationWebScopes()  // Requires EITHER scope

// Admin decorator (from local decorators)
@AdminAccess()               // Requires user in UserModel table
```

**Controller Pattern Examples:**

```typescript
// Admin-only controller
@Controller('admin-stuff')
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
export class AdminController { ... }

// Scope-only controller (no database lookup)
@Controller('public-stuff')
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@PublicWebScopes()
export class PublicController { ... }

// Mixed access: Admin OR specific scope (OR logic)
@Controller('shared-stuff')
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@ApplicationWebScopes()
@AdminAccess()
export class SharedController {
  // Admin users can access without scope
  // Application-web users can access via scope
}

// Method-level scope override
@Controller('mixed')
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()  // Class-level: admin required
export class MixedController {
  @Get('admin-only')
  adminOnly() { ... }  // Inherits @AdminAccess()
  
  @ApplicationWebScopes()  // Method-level scope
  @Get('shared')
  shared() { ... }  // Admin OR application-web
}
```

### Controller Authorization Tests

When testing controller authorization, use the **real Reflector** to read actual decorators from the controller.

**Test File Structure** (`*.controller.spec.ts`):

```typescript
import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'

import { SCOPES_KEY } from '@dmr.is/modules/guards/auth'
import { ADMIN_KEY } from '../../../core/decorators/admin.decorator'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import { IUsersService } from '../../users/users.service.interface'
import { MyController } from './my.controller'

// Test constants
const ADMIN_NATIONAL_ID = '1234567890'
const PUBLIC_WEB_NATIONAL_ID = '0987654321'
const APPLICATION_WEB_NATIONAL_ID = '1122334455'

// User factories
const createAdminUser = () => ({ nationalId: ADMIN_NATIONAL_ID, scope: '' })
const createPublicWebUser = () => ({ 
  nationalId: PUBLIC_WEB_NATIONAL_ID, 
  scope: '@logbirtingablad.is/logbirtingabladid' 
})
const createApplicationWebUser = () => ({ 
  nationalId: APPLICATION_WEB_NATIONAL_ID, 
  scope: '@logbirtingablad.is/lg-application-web' 
})

describe('MyController - Guard Authorization', () => {
  let authorizationGuard: AuthorizationGuard
  let reflector: Reflector
  let usersService: jest.Mocked<IUsersService>

  // Create context with REAL controller method reference
  const createMockContext = (
    user: MockUser | null,
    methodName: keyof MyController,
  ): ExecutionContext => ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => MyController.prototype[methodName] as () => void,
    getClass: () => MyController,
  } as unknown as ExecutionContext)

  beforeEach(async () => {
    const mockUsersService = {
      getUserByNationalId: jest.fn().mockImplementation((nationalId) => {
        if (nationalId === ADMIN_NATIONAL_ID) {
          return Promise.resolve({ id: '1', nationalId, name: 'Admin' })
        }
        throw new Error('User not found')
      }),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationGuard,
        Reflector,  // Use REAL Reflector
        { provide: IUsersService, useValue: mockUsersService },
      ],
    }).compile()

    authorizationGuard = module.get<AuthorizationGuard>(AuthorizationGuard)
    reflector = module.get<Reflector>(Reflector)
    usersService = module.get(IUsersService)
  })

  // Test decorator configuration
  describe('Decorator verification', () => {
    it('should have @AdminAccess() on class', () => {
      const isAdmin = reflector.getAllAndOverride(ADMIN_KEY, [MyController])
      expect(isAdmin).toBe(true)
    })

    it('should have @ApplicationWebScopes() on specificMethod', () => {
      const scopes = reflector.getAllAndOverride(SCOPES_KEY, [
        MyController.prototype.specificMethod,
        MyController,
      ])
      expect(scopes).toEqual(['@logbirtingablad.is/lg-application-web'])
    })
  })

  // Test authorization behavior
  describe('adminOnlyMethod', () => {
    it('should ALLOW admin users', async () => {
      const context = createMockContext(createAdminUser(), 'adminOnlyMethod')
      const result = await authorizationGuard.canActivate(context)
      expect(result).toBe(true)
    })

    it('should DENY non-admin users', async () => {
      const context = createMockContext(createPublicWebUser(), 'adminOnlyMethod')
      await expect(authorizationGuard.canActivate(context)).rejects.toThrow()
    })
  })
})
```

**Key Testing Principles:**

1. **Use real Reflector** - Don't mock it, so tests read actual decorators
2. **Mock only IUsersService** - Admin lookup via database
3. **Test each method** - Verify decorator inheritance and overrides
4. **Test user types** - Admin, public-web, application-web, unauthenticated
5. **Verify DB lookups** - Ensure `getUserByNationalId` called/not called appropriately

## Development Workflows

### Never Run npm/yarn Commands Directly

Always use Nx commands:

```bash
# ❌ Wrong
npm run dev
yarn start

# ✅ Correct
nx serve legal-gazette-api
nx serve legal-gazette-web
```

### Starting Applications

```bash
# Legal Gazette - Full Stack
nx run legal-gazette-api:dev-init    # Initialize DB (first time)
nx serve legal-gazette-api
nx serve legal-gazette-web

# Official Journal - Full Stack
nx run official-journal-api:dev-init  # Initialize with demo data
nx serve official-journal-web
nx serve official-journal-admin-api

# Regulations API
nx serve regulations-api
```

### Code Generation

**Next.js apps require codegen before build/serve** (configured in `project.json` dependencies):

```bash
# Update OpenAPI schema from running API, then generate TypeScript client
nx run official-journal-web:update-openapi-schema
nx run official-journal-web:codegen

# Or combined command
nx run official-journal-web:update-schema
```

Generated clients are placed in `apps/*/src/gen/fetch/`.

### Database Migrations

Legal Gazette and Official Journal APIs use **Sequelize CLI**:

```bash
nx run legal-gazette-api:migrate        # Run migrations
nx run legal-gazette-api:migrate/undo   # Rollback
nx run legal-gazette-api:seed           # Seed data
nx run legal-gazette-api:migrate/generate  # Generate new migration
```

#### Migration Naming Convention

Migration files should follow this pattern:
```
m-YYYYMMDD-description.js
```

Example: `m-20251229-subscriber-payments-alter.js`

#### BaseModel Required Columns

All tables that use `BaseModel` from `@dmr.is/shared/models/base` **must include these columns**:

```sql
-- Required columns for all BaseModel tables
ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
UPDATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
DELETED_AT TIMESTAMP WITH TIME ZONE  -- nullable, for soft deletes
```

**Example CREATE TABLE migration:**

```javascript
'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      CREATE TABLE my_table (
        -- BaseModel columns (required)
        ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UPDATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        DELETED_AT TIMESTAMP WITH TIME ZONE,

        -- Custom columns
        NAME TEXT NOT NULL,
        DESCRIPTION TEXT,
        FOREIGN_KEY_ID UUID REFERENCES other_table(ID) ON DELETE CASCADE
      );

      -- Indexes as needed
      CREATE INDEX idx_my_table_foreign_key ON my_table(FOREIGN_KEY_ID);

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;
      DROP TABLE IF EXISTS my_table;
      COMMIT;
    `)
  },
}
```

**Common column patterns:**
- Use `TEXT` for strings (not VARCHAR)
- Use `UUID` for IDs with `DEFAULT gen_random_uuid()`
- Use `TIMESTAMP WITH TIME ZONE` for dates
- Use `NUMERIC` for amounts/prices
- Use `BOOLEAN` with `DEFAULT false` for flags
- Add `ON DELETE CASCADE` or `ON DELETE SET NULL` for foreign keys

### Testing and Building

```bash
nx test <project>        # Run Jest tests
nx lint <project>        # ESLint with auto-fix
nx tsc <project>         # Type-check without emit
nx build <project>       # Build for production

# Run multiple projects
nx run-many --target=test --projects=legal-gazette-api,legal-gazette-web
```

## Next.js Application Architecture

The monorepo includes both **Pages Router** (Official Journal) and **App Router** (Legal Gazette) applications. **See `nextjs-architecture-guide.md` for detailed Next.js best practices.**

### Quick Architecture Reference

**Legal Gazette Web** (App Router - Modern Pattern):

```
apps/legal-gazette-web/src/
├── app/                          # Routes (Server Components by default)
│   ├── layout.tsx               # Root layout with providers
│   ├── (protected)/             # Route group with auth
│   │   ├── layout.tsx           # Shared layout for protected routes
│   │   ├── page.tsx             # Server Component - async data fetching
│   │   └── ritstjorn/
│   │       └── [id]/
│   │           ├── page.tsx     # Server Component - prefetch data
│   │           ├── loading.tsx  # Loading UI
│   │           └── error.tsx    # Error boundary
│   └── api/                     # API routes
├── components/
│   ├── providers/               # Client Components - context providers
│   └── field-set-items/         # Client Components - form fields
├── containers/                  # Client Components - page logic
└── lib/
    └── trpc/
        ├── client/              # Client-side tRPC
        └── server/              # Server-side tRPC
```

**Official Journal Web** (Pages Router - Legacy Pattern):

```
apps/official-journal-web/src/
├── pages/
│   ├── _app.tsx                 # App wrapper with providers
│   ├── _document.tsx            # HTML document
│   ├── index.tsx                # Home page with getServerSideProps
│   ├── api/                     # API routes
│   └── ritstjorn/
│       └── [...uid].tsx         # Dynamic route
├── components/                  # React components (client-side by default)
├── layout/                      # Layout components
└── lib/                         # Utilities and clients
```

### Server Components vs Client Components

**Server Components** (default in App Router):
- Async data fetching
- Direct database/API access
- No browser APIs
- Reduced bundle size

**Client Components** (mark with `'use client'`):
- Interactivity (onClick, onChange, etc.)
- React hooks (useState, useEffect, etc.)
- Browser APIs
- Context providers

**Decision Tree**:
```
Need interactivity/hooks/browser APIs?
├─ Yes → Client Component ('use client')
└─ No  → Server Component (default)
```

**📖 DETAILED NEXT.JS GUIDE**: For complete architecture patterns, directory structure, data fetching strategies, routing examples, and migration guides, see **[nextjs-architecture-guide.md](./nextjs-architecture-guide.md)**

## Backend Architecture

### NestJS Applications

- **ORM**: Sequelize with PostgreSQL
- **API Docs**: OpenAPI/Swagger (auto-generated)
- **Versioning**: URI versioning (`/api/v1/`, `/api/v2/`)
- **Logging**: Winston via `@dmr.is/logging` with Datadog APM
- **Auth**: JWT via `@dmr.is/auth`
- **Caching**: Redis with `@nestjs/cache-manager`

### Sequelize Models

Models use custom decorators from `@dmr.is/shared/models/base`:

```typescript
@BaseTable({ tableName: LegalGazetteModels.Advert })
export class AdvertModel extends BaseModel {
  // ...
}
```

Include models explicitly in module imports (no `autoLoadModels`).

### API Documentation

Legal Gazette API has **multiple Swagger endpoints** per audience:
- `/swagger` - Internal API
- `/island-is-swagger` - Island.is integration
- `/public-swagger` - Public web API
- `/application-web-swagger` - Application submissions

Check `apps/legal-gazette-api/src/swagger.config.ts` for configuration.

## External Dependencies

### Git Submodules

Island.is UI components sourced from sparse checkout:

```bash
# Auto-updated by git hooks (post-checkout, post-merge)
# Manual update:
./.gitscripts/checkout-submodules.sh
```

Configuration: `submodules/config.json` pins SHA and paths (`libs/shared` from island.is repo).

### AWS Services (DEV Environment)

Expose via Session Manager:

```bash
./scripts/run-pg-proxy.sh      # Database port 5432
./scripts/run-xroad-proxy.sh   # X-Road port 8000
```

- **Database**: Credentials in AWS Secrets Manager
- **X-Road**: Icelandic government data exchange layer

## Common Pitfalls

1. **Missing Codegen**: If Next.js build fails with "module not found" for API clients:
   ```bash
   nx run <app>:codegen
   ```

2. **Wrong Logger**: 
   - Using `@dmr.is/logging` in Next.js middleware → fails in Edge Runtime
   - Using `console.log` instead of logger → no structured logging/PII protection

3. **Wrong Port**: 
   - Legal Gazette API: 4100 (default)
   - Official Journal API: 4000 (default)
   - Check `process.env.*_PORT` in `.env` files

4. **Module Boundaries**: Nx enforces `@nx/enforce-module-boundaries`:
   ```typescript
   // ❌ Wrong
   import { Service } from 'libs/shared/modules/src/service'
   
   // ✅ Correct
   import { Service } from '@dmr.is/modules'
   ```

5. **Async Module Init**: Do NOT use `async` on NestJS module lifecycle methods:
   ```typescript
   // ❌ Wrong - causes silent startup failures
   static async forRoot() { ... }
   
   // ✅ Correct
   static forRoot() { ... }
   ```

6. **Server Component Mistakes**:
   - Using hooks in server components → mark with `'use client'`
   - Forgetting `async` on server components doing data fetching
   - Passing non-serializable props to client components

## Key Files to Reference

- `tsconfig.base.json` - All path aliases
- `nx.json` - Task runner config, caching
- `package.json` - Shortcut commands (`lg:*`, `ojoi-*`)
- `.eslintrc.yml` - Import ordering, naming conventions
- `apps/*/project.json` - Available Nx targets per app
- `nextjs-architecture-guide.md` - Next.js structure recommendations

## Creating New Code

### New NestJS API

```bash
nx generate @nx/nest:application --name=my-api --e2eTestRunner=none --strict=true
```

### New Next.js App

```bash
nx generate @nx/next:application --name=my-app --style=scss --linter=eslint
```

### New Shared Library

```bash
nx generate @nx/js:library my-lib --directory=libs/shared --publishable --importPath=@dmr.is/my-lib
```

## Important Notes

- Port conventions: Official Journal API (3000/4000), Legal Gazette API (4100), Regulations API (3000)
- All APIs use `/api/v1/` or `/api/v2/` prefix
- Use `ExceptionFactoryPipe()` for validation error handling in NestJS
- Authentication: JWT for APIs, session-based (NextAuth) for web apps
- Date handling: `date-fns` and `fridagar` (Icelandic holidays)
- SSN validation: `kennitala` package
- Phone validation: `libphonenumber-js`
- Always mask national IDs in logs (handled automatically by loggers)

## Debugging Tips

```bash
# Clear Nx cache
rm -rf .cache/nx

# Reset git submodules
./.gitscripts/checkout-submodules.sh

# Restart Docker services
nx run legal-gazette-api:dev-services

# View running processes
nx run-many --target=serve --projects=legal-gazette-api,legal-gazette-web --parallel
```

## Code Quality Standards

- **Type Safety**: Strict TypeScript, no `any` types
- **Error Handling**: Use try-catch with proper logging
- **Validation**: Zod schemas for forms, class-validator for DTOs
- **Testing**: Write tests for business logic and API endpoints
- **Documentation**: JSDoc comments for complex functions
- **Plan Files**: When working on a feature with a `plan-*.md` file, **always update the plan** to reflect current progress (mark phases complete, update status tables, note decisions made)
- **Naming**: 
  - Components: PascalCase
  - Files: kebab-case for multi-word, camelCase for single word
  - Constants: UPPER_SNAKE_CASE
  - Functions: camelCase

## Getting Started

1. **Initial Setup**:
   ```bash
   ./.gitscripts/checkout-submodules.sh
   yarn
   ```

2. **Start Development**:
   ```bash
   # Legal Gazette
   nx run legal-gazette-api:dev-init
   nx serve legal-gazette-api
   nx serve legal-gazette-web
   
   # Official Journal
   nx run official-journal-api:dev-init
   nx serve official-journal-web
   ```

3. **Run Tests**:
   ```bash
   nx test legal-gazette-api
   nx test legal-gazette-web
   ```

## Support and Resources

- **Nx Documentation**: https://nx.dev
- **NestJS Documentation**: https://docs.nestjs.com
- **Next.js Documentation**: https://nextjs.org/docs
- **Island.is Design System**: https://ui.island.is
- **Internal Wiki**: (if available, add link here)

---

**Remember**: This is a production system serving Iceland's government. Always prioritize security, data privacy, and code quality.
