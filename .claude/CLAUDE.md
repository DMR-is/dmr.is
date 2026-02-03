# DMR.is Monorepo - Claude Code Instructions

**Welcome to the DMR.is monorepo!** This guide provides quick orientation. For detailed patterns and app-specific guidance, see the documentation links below.

---

## 📖 Documentation Guide

### Working on Specific Applications

Choose the guide for the application family you're working on:

- **[Legal Gazette Apps](.claude/apps/legal-gazette/CLAUDE.md)** - `legal-gazette-*` (tRPC, App Router, authorization)
- **[Official Journal Apps](.claude/apps/official-journal/CLAUDE.md)** - `official-journal-*` (OpenAPI, Pages Router, legacy patterns)
- **[Regulations API](.claude/apps/regulations/CLAUDE.md)** - `regulations-api` (Fastify, temporal versioning)

### Technical Conventions (Cross-Cutting)

Reference these guides for specific technical patterns:

- **[Logging](.claude/conventions/logging.md)** - Which logger to use where (`@dmr.is/logging` vs `@dmr.is/logging-next`)
- **[NestJS](.claude/conventions/nestjs.md)** - Controllers, services, modules, testing
- **[Next.js](.claude/conventions/nextjs.md)** - App Router vs Pages Router, Server vs Client Components
- **[Imports](.claude/conventions/imports.md)** - Path aliases and import ordering
- **[Testing](.claude/conventions/testing.md)** - Jest patterns, test commands

### Skills (Code Generation)

Use these skills to auto-generate code following established patterns:

- `/nestjs-controller` - Create NestJS endpoints with DTOs, services, tests ([skill doc](.claude/skills/nestjs-controller/skill.md))
- `/database-migrations` - Generate Sequelize migrations ([skill doc](.claude/skills/database-migrations/skill.md))
- `/unit-tests` - Create Jest tests ([skill doc](.claude/skills/unit-tests/skill.md))
- `/codegen` - Regenerate OpenAPI clients ([skill doc](.claude/skills/codegen/skill.md))
- `/nextjs-trpc-page` - Create Next.js + tRPC pages ([skill doc](.claude/skills/nextjs-trpc-page/skill.md))

### Deep Dives

- **[Next.js Architecture Guide](.github/nextjs-architecture-guide.md)** - Complete App Router vs Pages Router patterns
- **[Authorization Guide](.claude/skills/nestjs-controller/authorization-guide.md)** - Legal Gazette authorization patterns

---

## Planning-First Workflow

**IMPORTANT**: For new features, multi-file changes, or complex tasks, follow the planning-first approach.

### When to Plan

Ask the user about creating a planning file when:
- Implementing a new feature spanning multiple files
- Making architectural changes
- Refactoring existing code across modules
- Adding new database migrations or models
- Creating new API endpoints with corresponding frontend changes

### Planning Process

1. **Ask First**: "This looks like a multi-step task. Would you like me to create a planning file first in `.github/planning/<product>/` before implementing?"

2. **Create Plan**: If approved, create a detailed plan at `.github/planning/<product>/plan-<feature-name>.md` including:
   - Summary and implementation phases
   - Files to create/modify
   - Database changes
   - Security considerations
   - Testing checklist
   - Status tracking table

3. **Summarize and Confirm**: Provide a brief summary of key phases and ask: "Should I proceed with implementation?"

4. **Update During Implementation**: Keep the planning file updated with progress

**Example**: See [plan-legacy-subscriber-migration.md](.github/planning/legal-gazette/plan-legacy-subscriber-migration.md)

**Planning Folders**: `.github/planning/legal-gazette/`, `.github/planning/ojoi/`, `.github/planning/shared/`

---

## Project Overview

This is an **Nx monorepo** managing multiple applications for Iceland's DMR (Dómsmálaráðuneytið - Ministry of Justice).

### Technology Stack

- **Monorepo**: Nx
- **Backend**: NestJS (most APIs), Fastify (Regulations), Sequelize ORM, PostgreSQL
- **Frontend**: Next.js (App Router for new apps, Pages Router for legacy)
- **Styling**: Vanilla Extract CSS-in-JS
- **UI**: Island.is UI components (git submodules)
- **APIs**: tRPC (Legal Gazette), OpenAPI-generated clients (Official Journal)
- **Auth**: NextAuth.js (web), JWT (APIs)
- **State**: Tanstack Query, Zustand
- **Forms**: React Hook Form with Zod validation
- **Package Manager**: Yarn 4.7.0 (npm disabled)
- **Node**: 20.15.0

### Product Families

**Official Journal (Stjórnartíðindi)** - `official-journal-*`:
- `official-journal-api` (4000), `official-journal-admin-api` (4001), `official-journal-application-api` (4002)
- `official-journal-web` (3000, Pages Router), `official-journal-api-export`

**Legal Gazette (Lögbirtingablað)** - `legal-gazette-*`:
- `legal-gazette-api` (4100)
- `legal-gazette-web` (4200), `legal-gazette-application-web` (4300), `legal-gazette-public-web` (4400)
- All use App Router

**Regulations (Reglugerðir)**:
- `regulations-api` (3000, Fastify-based with temporal versioning)

### Shared Libraries

Organized under `libs/` with TypeScript path aliases:

- `@dmr.is/modules` - Reusable NestJS modules
- `@dmr.is/db` - Sequelize configuration
- `@dmr.is/auth` - Authentication guards/strategies
- `@dmr.is/logging` - Winston logger (Node.js only, for NestJS APIs)
- `@dmr.is/logging-next` - Lightweight logger (Edge-compatible, for Next.js)
- `@dmr.is/utils`, `@dmr.is/constants` - Utilities and constants
- `@dmr.is/shared/*` - DTOs, filters, interceptors, middleware
- `@dmr.is/pipelines` - Validation pipes
- `@dmr.is/decorators` - Custom decorators
- `@dmr.is/ui/components/*` - Shared React components
- `@dmr.is/trpc/client/*` - tRPC client utilities
- `@island.is/island-ui/*` - Island.is UI components

---

## Critical Conventions

### Import Path Aliases

**Always use TypeScript path aliases** (never relative paths for shared libs):

```typescript
// ✅ Correct
import { LogMethod } from '@dmr.is/decorators'
import { CaseService } from '@dmr.is/modules'
import { Box } from '@island.is/island-ui/core'

// ❌ Wrong
import { LogMethod } from '../../../libs/shared/decorators'
```

**See**: [Import Conventions](.claude/conventions/imports.md)

### Logging

**Use the correct logger for each runtime**:

| Context | Logger | Why |
|---------|--------|-----|
| NestJS APIs | `@dmr.is/logging` | Full Winston features |
| Next.js App Router | `@dmr.is/logging-next` | Edge Runtime compatible |
| Next.js Pages Router (OJ Web) | `@dmr.is/logging` | Node.js runtime OK |

**Never use `console.log`** - always use the appropriate logger.

**See**: [Logging Conventions](.claude/conventions/logging.md)

### Custom ESLint Rules

Located in `eslint-local-rules.js`:

1. **`require-reduce-defaults`**: Always provide initial value to `.reduce()`
2. **`disallow-kennitalas`**: No real Icelandic SSNs in code (prevents PII leaks)
3. **`no-async-module-init`**: No async in NestJS `register`, `forRoot`, etc. (causes startup failures)

---

## Development Workflows

### Never Run npm/yarn Directly

Always use Nx commands:

```bash
# ❌ Wrong
npm run dev

# ✅ Correct
yarn nx serve legal-gazette-api
```

### Getting Started

**Initial Setup**:
```bash
./.gitscripts/checkout-submodules.sh
yarn
```

**Start Legal Gazette**:
```bash
yarn nx run legal-gazette-api:dev-init    # First time only
yarn nx serve legal-gazette-api
yarn nx serve legal-gazette-web           # Separate terminal
```

**Start Official Journal**:
```bash
yarn nx run official-journal-api:dev-init  # First time only
yarn nx serve official-journal-api
yarn nx serve official-journal-web         # Separate terminal
```

### Testing

```bash
# Run all tests for a project
yarn nx test <project>

# Run specific test file (RECOMMENDED - faster)
yarn nx test <project> --testFile=<path/to/file.spec.ts>

# Run with coverage
yarn nx test <project> --coverage
```

**See**: [Testing Conventions](.claude/conventions/testing.md)

### Code Generation (OpenAPI)

**Official Journal Web** requires OpenAPI codegen:

```bash
# Use skill (auto-detects app)
/codegen

# Or run manually (API must be running first)
yarn nx run official-journal-web:update-schema
```

**Legal Gazette apps use tRPC directly** (no codegen needed).

**See**: [Codegen Skill](.claude/skills/codegen/skill.md)

### Database Migrations

```bash
# Run migrations
yarn nx run legal-gazette-api:migrate

# Rollback
yarn nx run legal-gazette-api:migrate/undo

# Generate new
yarn nx run legal-gazette-api:migrate/generate
```

**Naming**: `m-YYYYMMDD-description.js`

**See**: [Database Migrations Skill](.claude/skills/database-migrations/skill.md)

---

## Common Pitfalls

1. **Missing Codegen**: Next.js build fails with "module not found" for API clients
   - **Solution**: Run `nx run <app>:codegen` (Official Journal only)

2. **Wrong Logger**: Using `@dmr.is/logging` in Next.js middleware fails in Edge Runtime
   - **Solution**: Use `@dmr.is/logging-next` in Next.js apps

3. **Wrong Port**:
   - Legal Gazette API: 4100
   - Official Journal API: 4000
   - Regulations API: 3000

4. **Module Boundaries**: Nx enforces `@nx/enforce-module-boundaries`
   - **Solution**: Use path aliases, not relative paths

5. **Async Module Init**: Using `async` on NestJS `forRoot`/`register` causes silent failures
   - **Solution**: Use `useFactory` for async initialization

6. **Server Component Mistakes**:
   - Using hooks in Server Components → mark with `'use client'`
   - Forgetting `async` on Server Components doing data fetching

---

## Code Quality Standards

- **Type Safety**: Strict TypeScript, no `any` types
- **Error Handling**: Use try-catch with proper logging
- **Validation**: Zod schemas for forms, class-validator for DTOs
- **Testing**: Write tests for business logic and API endpoints
- **Documentation**: JSDoc comments for complex functions
- **Plan Files**: When working on a feature with a `plan-*.md` file, **always update the plan** to reflect progress
- **Naming**:
  - Components: PascalCase
  - Files: kebab-case (multi-word), camelCase (single word)
  - Constants: UPPER_SNAKE_CASE
  - Functions: camelCase

---

## Creating New Code

### New NestJS API

```bash
yarn nx generate @nx/nest:application --name=my-api --e2eTestRunner=none --strict=true
```

### New Next.js App

```bash
yarn nx generate @nx/next:application --name=my-app --style=scss --linter=eslint
```

### New Shared Library

```bash
yarn nx generate @nx/js:library my-lib --directory=libs/shared --publishable --importPath=@dmr.is/my-lib
```

---

## Key Files to Reference

- `tsconfig.base.json` - All path aliases
- `nx.json` - Task runner config, caching
- `package.json` - Shortcut commands (`lg:*`, `ojoi-*`)
- `.eslintrc.yml` - Import ordering, naming conventions
- `apps/*/project.json` - Available Nx targets per app

---

## External Dependencies

### Git Submodules

Island.is UI components sourced from sparse checkout:

```bash
# Auto-updated by git hooks (post-checkout, post-merge)
# Manual update:
./.gitscripts/checkout-submodules.sh
```

Configuration: `submodules/config.json`

### AWS Services (DEV)

```bash
./scripts/run-pg-proxy.sh      # Database port 5432
./scripts/run-xroad-proxy.sh   # X-Road port 8000
```

---

## Important Notes

- All APIs use `/api/v1/` or `/api/v2/` prefix
- Use `ExceptionFactoryPipe()` for validation error handling in NestJS
- Authentication: JWT for APIs, session-based (NextAuth) for web apps
- Date handling: `date-fns` and `fridagar` (Icelandic holidays)
- SSN validation: `kennitala` package
- Phone validation: `libphonenumber-js`
- National IDs are automatically masked in logs

---

## Debugging Tips

```bash
# Clear Nx cache
rm -rf .cache/nx

# Reset git submodules
./.gitscripts/checkout-submodules.sh

# Restart Docker services
yarn nx run legal-gazette-api:dev-services
```

---

## Support and Resources

- **Nx**: https://nx.dev
- **NestJS**: https://docs.nestjs.com
- **Next.js**: https://nextjs.org/docs
- **Island.is Design System**: https://ui.island.is

---

**Remember**: This is a production system serving Iceland's government. Always prioritize security, data privacy, and code quality.
