# Legal Gazette (Lögbirtingablað) Applications

This guide covers everything specific to the Legal Gazette product family.

## Overview

The Legal Gazette system manages Iceland's official legal gazette publications, including adverts, subscriptions, and public access.

### Applications

1. **legal-gazette-api** - Main backend API (NestJS, Port 4100)
2. **legal-gazette-web** - Main web application (Next.js App Router, Port 4200)
3. **legal-gazette-application-web** - Application submission frontend (Next.js App Router, Port 4300)
4. **legal-gazette-public-web** - Public-facing website (Next.js App Router, Port 4400)

## Technology Stack

### Backend (legal-gazette-api)

- **Framework**: NestJS
- **Database**: PostgreSQL via Sequelize ORM
- **Logger**: `@dmr.is/logging` (Winston)
- **Auth**: JWT via `@dmr.is/auth`
- **API Docs**: Multiple Swagger endpoints per audience
- **API Style**: tRPC (primary) + REST (legacy)
- **Port**: 4100 (default)

### Frontend (All Legal Gazette Web Apps)

- **Framework**: Next.js 13+ with App Router
- **Logger**: `@dmr.is/logging-next` (**ESLint enforced**)
- **API Client**: tRPC React Query hooks
- **Auth**: NextAuth.js (session-based)
- **State**: Tanstack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **UI**: Island.is UI components
- **Styling**: Vanilla Extract CSS-in-JS

**Ports**:
- legal-gazette-web: 4200
- legal-gazette-application-web: 4300
- legal-gazette-public-web: 4400

## Getting Started

### First-Time Setup

```bash
# Initialize database and seed data
yarn nx run legal-gazette-api:dev-init

# Start API
yarn nx serve legal-gazette-api

# Start main web app (in separate terminal)
yarn nx serve legal-gazette-web
```

### Daily Development

```bash
# Start API
yarn nx serve legal-gazette-api

# Start web app
yarn nx serve legal-gazette-web

# Start application web (if needed)
yarn nx serve legal-gazette-application-web

# Start public web (if needed)
yarn nx serve legal-gazette-public-web
```

## Critical Conventions

### Logging (ESLint Enforced)

**All Legal Gazette Next.js apps MUST use `@dmr.is/logging-next`:**

```typescript
// ✅ Correct - Required for Edge Runtime compatibility
import { getLogger } from '@dmr.is/logging-next'

// ❌ Wrong - Will fail ESLint
import { getLogger } from '@dmr.is/logging'
```

**ESLint Rule**:
```yaml
no-restricted-imports:
  - error
  - patterns:
    - pattern: '@dmr.is/logging'
      message: 'Use @dmr.is/logging-next in Next.js apps (Edge Runtime compatible)'
```

**API (legal-gazette-api) uses `@dmr.is/logging`**:
```typescript
import { getLogger } from '@dmr.is/logging'
```

**See**: [Logging Conventions](../../conventions/logging.md)

### App Router Patterns

All Legal Gazette web apps use Next.js App Router (not Pages Router).

**Server Components** (default):
```typescript
// app/ritstjorn/[id]/page.tsx
import { trpc } from '@/lib/trpc/server'

export default async function AdvertPage({ params }: { params: { id: string } }) {
  const advert = await trpc.advert.getById({ id: params.id })

  return <AdvertDetail advert={advert} />
}
```

**Client Components** (interactive):
```typescript
'use client'

import { trpc } from '@/lib/trpc/client'

export function AdvertForm() {
  const createMutation = trpc.advert.create.useMutation()

  // ... form logic
}
```

**See**: [Next.js Conventions](../../conventions/nextjs.md)

## API Architecture

### Multiple Swagger Endpoints

The Legal Gazette API has **separate Swagger documentation per audience**:

| Endpoint | Audience | Scope/Auth |
|----------|----------|------------|
| `/swagger` | Internal API | Admin access |
| `/island-is-swagger` | Island.is integration | Island.is scope |
| `/public-swagger` | Public web API | Public scope |
| `/application-web-swagger` | Application submissions | Application scope |

**Configuration**: `apps/legal-gazette-api/src/swagger.config.ts`

### Authorization Decorators

Legal Gazette API uses `AuthorizationGuard` with these decorators:

```typescript
import {
  AdminAccess,
  PublicWebScopes,
  ApplicationWebScopes,
  PublicOrApplicationWebScopes,
} from '@dmr.is/auth'

@Controller('adverts')
export class AdvertController {
  // Requires user in UserModel (DB lookup)
  @AdminAccess()
  @Get('admin')
  findAllAdmin() { }

  // Requires '@logbirtingablad.is/logbirtingabladid' scope
  @PublicWebScopes()
  @Get('public')
  findAllPublic() { }

  // Requires '@logbirtingablad.is/lg-application-web' scope
  @ApplicationWebScopes()
  @Get('applications')
  findAllApplications() { }

  // Either scope works (OR logic)
  @PublicOrApplicationWebScopes()
  @Get('mixed')
  findAllMixed() { }
}
```

**Authorization Logic**: Admin + Scope = OR (either grants access)

**See**: [Authorization Guide](../../skills/nestjs-controller/authorization-guide.md)

## tRPC Setup

### Server-Side (tRPC in API)

**Router Definition**:
```typescript
// apps/legal-gazette-api/src/trpc/routers/advert.router.ts
import { z } from 'zod'
import { publicProcedure, protectedProcedure } from '../trpc'

export const advertRouter = {
  list: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.advertService.findAll()
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.advertService.findOne(input.id)
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(3),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.advertService.create(input, ctx.user)
    }),
}
```

### Client-Side (Next.js Apps)

**Server Component**:
```typescript
// app/ritstjorn/page.tsx
import { trpc } from '@/lib/trpc/server'

export default async function AdvertsPage() {
  const adverts = await trpc.advert.list()

  return (
    <div>
      {adverts.map((advert) => (
        <AdvertCard key={advert.id} advert={advert} />
      ))}
    </div>
  )
}
```

**Client Component** (with React Query):
```typescript
'use client'

import { trpc } from '@/lib/trpc/client'

export function AdvertsList() {
  const { data: adverts, isLoading } = trpc.advert.list.useQuery()

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      {adverts?.map((advert) => (
        <AdvertCard key={advert.id} advert={advert} />
      ))}
    </div>
  )
}
```

**Mutations**:
```typescript
'use client'

export function CreateAdvertForm() {
  const utils = trpc.useContext()
  const createMutation = trpc.advert.create.useMutation({
    onSuccess: () => {
      utils.advert.list.invalidate()
    },
  })

  const onSubmit = async (data: FormData) => {
    await createMutation.mutateAsync(data)
  }

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>
}
```

## Code Generation

**Legal Gazette web apps do NOT use OpenAPI codegen** (they use tRPC directly).

If you need to regenerate tRPC types:

```bash
# API must be running on port 4100
yarn nx serve legal-gazette-api

# In separate terminal, restart web app to pick up new types
yarn nx serve legal-gazette-web --reset
```

## Database Migrations

### Commands

```bash
# Run migrations
yarn nx run legal-gazette-api:migrate

# Rollback last migration
yarn nx run legal-gazette-api:migrate/undo

# Generate new migration
yarn nx run legal-gazette-api:migrate/generate
```

### Migration Naming

`m-YYYYMMDD-description.js`

**Example**: `m-20260203-add-advert-signatures.js`

**See**: [Database Migrations Skill](../../skills/database-migrations/skill.md)

## Common Workflows

### Adding a New Advert Type

1. **Create migration** to add new type to database
2. **Update API**:
   - Add type to constants
   - Update DTOs for validation
   - Add/update service methods
   - Update tRPC routers
3. **Update Web App**:
   - Add new form components
   - Update routing (if needed)
   - Add new UI for type-specific fields

### Creating a New API Endpoint

Use the `/nestjs-controller` skill:

```bash
# Or manually follow these steps:
1. Create DTO in libs/shared/dto
2. Create service method in *.service.ts
3. Add controller method in *.controller.ts
4. Write tests for service and controller
5. Add tRPC procedure (if needed)
6. Document in Swagger with decorators
```

**See**: [NestJS Controller Skill](../../skills/nestjs-controller/skill.md)

### Building a New Public Page

Use the `/nextjs-trpc-page` skill:

```bash
# Or manually:
1. Create page.tsx in app/ directory
2. Fetch data using tRPC server client
3. Create Client Components for interactivity
4. Add loading.tsx for loading states
5. Add error.tsx for error handling
```

**See**: [Next.js tRPC Page Skill](../../skills/nextjs-trpc-page/skill.md)

## Testing

### API Tests

```bash
# Run all tests
yarn nx test legal-gazette-api

# Run specific test file (faster)
yarn nx test legal-gazette-api --testFile=apps/legal-gazette-api/src/modules/advert/advert.service.spec.ts

# Run with coverage
yarn nx test legal-gazette-api --coverage
```

**See**: [Testing Conventions](../../conventions/testing.md)

### Web App Tests

```bash
# Run all tests
yarn nx test legal-gazette-web

# Run specific test file
yarn nx test legal-gazette-web --testFile=apps/legal-gazette-web/src/components/AdvertCard.spec.tsx
```

## Common Pitfalls

### 1. Wrong Logger in Next.js Apps

```typescript
// ❌ Wrong - Will fail ESLint
import { getLogger } from '@dmr.is/logging'

// ✅ Correct - Required for Edge Runtime
import { getLogger } from '@dmr.is/logging-next'
```

### 2. Missing tRPC Server Import

```typescript
// ❌ Wrong - Using client tRPC in Server Component
import { trpc } from '@/lib/trpc/client'

// ✅ Correct - Use server tRPC
import { trpc } from '@/lib/trpc/server'
```

### 3. Wrong Port

```bash
# ❌ Wrong - Official Journal port
curl http://localhost:4000/api/v1/adverts

# ✅ Correct - Legal Gazette port
curl http://localhost:4100/api/v1/adverts
```

### 4. Forgetting Authorization Decorators

```typescript
// ❌ Wrong - No authorization
@Get('admin')
findAll() { }

// ✅ Correct - Admin access required
@AdminAccess()
@Get('admin')
findAll() { }
```

### 5. Not Using Route Groups

```typescript
// ❌ Wrong - Creates /protected in URL
app/protected/ritstjorn/page.tsx

// ✅ Correct - No /protected in URL
app/(protected)/ritstjorn/page.tsx
```

## Environment Variables

### API (.env)

```bash
LEGAL_GAZETTE_API_PORT=4100
DATABASE_URL=postgresql://user:password@localhost:5432/legal-gazette
JWT_SECRET=your-secret-here
REDIS_URL=redis://localhost:6379
```

### Web Apps (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:4100
NEXTAUTH_URL=http://localhost:4200
NEXTAUTH_SECRET=your-secret-here
```

## Related Skills

- **[/nestjs-controller](../../skills/nestjs-controller/skill.md)** - Create NestJS endpoints
- **[/database-migrations](../../skills/database-migrations/skill.md)** - Create migrations
- **[/unit-tests](../../skills/unit-tests/skill.md)** - Generate tests
- **[/nextjs-trpc-page](../../skills/nextjs-trpc-page/skill.md)** - Create Next.js pages with tRPC

## Related Conventions

- **[Logging](../../conventions/logging.md)** - Which logger to use
- **[NestJS](../../conventions/nestjs.md)** - NestJS patterns
- **[Next.js](../../conventions/nextjs.md)** - Next.js patterns
- **[Testing](../../conventions/testing.md)** - Testing patterns
- **[Imports](../../conventions/imports.md)** - Import conventions

## Additional Resources

- **API Swagger**: http://localhost:4100/swagger (when API is running)
- **Public Swagger**: http://localhost:4100/public-swagger
- **Main App**: http://localhost:4200 (when web app is running)
- **Application Web**: http://localhost:4300
- **Public Web**: http://localhost:4400
