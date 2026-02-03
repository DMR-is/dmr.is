# Official Journal (Stjórnartíðindi) Applications

This guide covers everything specific to the Official Journal product family.

## Overview

The Official Journal system manages Iceland's official government journal publications (Stjórnartíðindi), including digital publications, PDF generation, and public access.

### Applications

1. **official-journal-api** - Main backend API (NestJS, Port 4000)
2. **official-journal-admin-api** - Admin-specific API (NestJS, Port 4001)
3. **official-journal-application-api** - Application submission API (NestJS, Port 4002)
4. **official-journal-web** - Public web frontend (Next.js Pages Router, Port 3000)
5. **official-journal-api-export** - Export service (Node.js with Esbuild)

## Technology Stack

### Backend (NestJS APIs)

- **Framework**: NestJS
- **Database**: PostgreSQL via Sequelize ORM
- **Logger**: `@dmr.is/logging` (Winston)
- **Auth**: JWT via `@dmr.is/auth`
- **API Docs**: OpenAPI/Swagger
- **API Style**: REST (OpenAPI-generated clients)
- **Ports**:
  - Main API: 4000
  - Admin API: 4001
  - Application API: 4002

### Frontend (official-journal-web)

- **Framework**: Next.js with **Pages Router** (legacy, stable)
- **Logger**: `@dmr.is/logging` (works in Node.js runtime)
- **API Client**: OpenAPI-generated fetch client
- **Auth**: NextAuth.js (session-based)
- **State**: React Query
- **Forms**: React Hook Form
- **UI**: Island.is UI components
- **Styling**: Vanilla Extract CSS-in-JS
- **Port**: 3000

## Getting Started

### First-Time Setup

```bash
# Initialize database with demo data
yarn nx run official-journal-api:dev-init

# Start main API
yarn nx serve official-journal-api

# Start web app (in separate terminal)
yarn nx serve official-journal-web

# Start admin API (if needed)
yarn nx serve official-journal-admin-api
```

### Daily Development

```bash
# Start main API
yarn nx serve official-journal-api

# Start web app
yarn nx serve official-journal-web

# Start admin API (if needed for admin features)
yarn nx serve official-journal-admin-api

# Start application API (if needed for submissions)
yarn nx serve official-journal-application-api
```

## Critical Conventions

### Pages Router (Not App Router)

Official Journal Web uses the **legacy Pages Router** pattern, not the modern App Router.

**Key Differences**:
- Files in `pages/` directory (not `app/`)
- Use `getServerSideProps` for data fetching (not async components)
- Manual layouts via `_app.tsx` (not layout.tsx)
- API routes in `pages/api/` (same as App Router)

**Example Page**:
```typescript
// pages/ritstjorn/[id].tsx
import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!
  const advert = await getAdvert(id as string)

  if (!advert) {
    return { notFound: true }
  }

  return {
    props: { advert },
  }
}

export default function AdvertPage({ advert }) {
  return (
    <div>
      <h1>{advert.title}</h1>
      <p>{advert.description}</p>
    </div>
  )
}
```

**See**: [Next.js Conventions](../../conventions/nextjs.md#pages-router-patterns-legacy)

### Logging

Official Journal Web uses `@dmr.is/logging` (Winston-based), which works because the Pages Router runs in Node.js runtime (not Edge Runtime):

```typescript
// ✅ Correct for Official Journal Web
import { getLogger } from '@dmr.is/logging'

const logger = getLogger('AdvertPage')
```

**APIs use the same logger**:
```typescript
import { getLogger } from '@dmr.is/logging'

const logger = getLogger('AdvertService')
```

**See**: [Logging Conventions](../../conventions/logging.md)

## API Architecture

### Three Separate APIs

Unlike Legal Gazette (which has one API with multiple Swagger endpoints), Official Journal has **three separate NestJS applications**:

1. **official-journal-api** (Port 4000)
   - Main API for public data
   - User authentication
   - Public journal entries

2. **official-journal-admin-api** (Port 4001)
   - Admin-only operations
   - User management
   - Advanced features

3. **official-journal-application-api** (Port 4002)
   - Application submissions
   - External integrations

**Why Separate?**: Historical reasons, allows independent scaling and deployment.

### OpenAPI/Swagger

Each API has a single Swagger endpoint:

```bash
# Main API docs
http://localhost:4000/api/documentation

# Admin API docs
http://localhost:4001/api/documentation

# Application API docs
http://localhost:4002/api/documentation
```

## Code Generation

**Official Journal Web requires OpenAPI codegen** to generate the API client.

### Prerequisite

The main API must be running before codegen:

```bash
# Start API first
yarn nx serve official-journal-api
```

### Generate Client

```bash
# Use the codegen skill (auto-detects the app)
/codegen

# Or run manually
yarn nx run official-journal-web:update-schema
```

**Generated files**: `apps/official-journal-web/src/gen/fetch/`

**When to run**:
- After API endpoint changes
- After DTO changes
- Before building the web app

### Using Generated Client

```typescript
import { Configuration, AdvertsApi } from '@/gen/fetch'

const config = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL,
})

const advertsApi = new AdvertsApi(config)

// In getServerSideProps
export const getServerSideProps: GetServerSideProps = async () => {
  const adverts = await advertsApi.advertControllerFindAll()

  return {
    props: { adverts },
  }
}
```

## Database Migrations

### Commands

```bash
# Run migrations
yarn nx run official-journal-api:migrate

# Rollback last migration
yarn nx run official-journal-api:migrate/undo

# Generate new migration
yarn nx run official-journal-api:migrate/generate
```

### Migration Naming

`m-YYYYMMDD-description.js`

**Example**: `m-20260203-add-journal-signatures.js`

**See**: [Database Migrations Skill](../../skills/database-migrations/SKILL.md)

## Common Workflows

### Adding a New Form to Web App

1. **Create form component** with React Hook Form
2. **Define Zod schema** for validation
3. **Add API endpoint** (if new)
4. **Run codegen** to update client
5. **Wire up form submission** using generated API client
6. **Add validation** and error handling

### Creating a New API Endpoint

Use the `/nestjs-controller` skill:

```bash
# Or manually:
1. Create DTO in libs/shared/dto
2. Create service method in *.service.ts
3. Add controller method in *.controller.ts
4. Write tests for service and controller
5. Document in Swagger with @ApiProperty decorators
6. Run codegen in web app
```

**See**: [NestJS Controller Skill](../../skills/nestjs-controller/SKILL.md)

### Updating Journal Layout

1. **Modify page component** in `pages/`
2. **Update shared layout** in `layout/` if needed
3. **Update styles** using Vanilla Extract
4. **Test in browser** (no build needed for dev)

## Testing

### API Tests

```bash
# Run all tests for main API
yarn nx test official-journal-api

# Run specific test file (faster)
yarn nx test official-journal-api --testFile=apps/official-journal-api/src/modules/advert/advert.service.spec.ts

# Test admin API
yarn nx test official-journal-admin-api

# Test application API
yarn nx test official-journal-application-api
```

**See**: [Testing Conventions](../../conventions/testing.md)

### Web App Tests

```bash
# Run all tests
yarn nx test official-journal-web

# Run specific test file
yarn nx test official-journal-web --testFile=apps/official-journal-web/src/components/AdvertCard.spec.tsx
```

## Export Service

### official-journal-api-export

Special Node.js service (not NestJS) that handles PDF generation and exports.

**Build**: Uses Esbuild (not webpack)

**Start**:
```bash
yarn nx serve official-journal-api-export
```

**Purpose**: Generate PDFs, export journal data, scheduled tasks

## Common Pitfalls

### 1. Missing Codegen

```typescript
// ❌ Error: Cannot find module '@/gen/fetch'
import { AdvertsApi } from '@/gen/fetch'

// ✅ Solution: Run codegen
yarn nx run official-journal-web:update-schema
```

### 2. API Not Running During Codegen

```bash
# ❌ Codegen fails if API not running
yarn nx run official-journal-web:update-schema
# Error: connect ECONNREFUSED localhost:4000

# ✅ Start API first
yarn nx serve official-journal-api
# Then run codegen in separate terminal
```

### 3. Using App Router Patterns

```typescript
// ❌ Wrong - App Router pattern (doesn't work)
export default async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}

// ✅ Correct - Pages Router pattern
export const getServerSideProps: GetServerSideProps = async () => {
  const data = await fetchData()
  return { props: { data } }
}

export default function Page({ data }) {
  return <div>{data}</div>
}
```

### 4. Wrong API Port

```bash
# ❌ Wrong - Legal Gazette port
curl http://localhost:4100/api/v1/adverts

# ✅ Correct - Official Journal port
curl http://localhost:4000/api/v1/adverts
```

### 5. Trying to Use tRPC

Official Journal uses OpenAPI-generated clients, **not tRPC**:

```typescript
// ❌ Wrong - tRPC not available
import { trpc } from '@/lib/trpc/client'

// ✅ Correct - Use generated API client
import { AdvertsApi } from '@/gen/fetch'
```

## Pages Router Data Fetching

### getServerSideProps (SSR)

For pages that need fresh data on every request:

```typescript
import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!
  const data = await fetchData(id)

  return {
    props: { data },
  }
}

export default function Page({ data }) {
  return <div>{data.title}</div>
}
```

### getStaticProps (SSG)

For pages that can be statically generated:

```typescript
import type { GetStaticProps } from 'next'

export const getStaticProps: GetStaticProps = async () => {
  const data = await fetchData()

  return {
    props: { data },
    revalidate: 60, // Revalidate every 60 seconds
  }
}
```

### API Routes

For server-side endpoints:

```typescript
// pages/api/adverts/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query

  if (req.method === 'GET') {
    const advert = await getAdvert(id as string)
    return res.status(200).json(advert)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
```

## Client-Side Data Fetching

Use React Query for client-side data fetching:

```typescript
import { useQuery } from '@tanstack/react-query'

function AdvertsList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['adverts'],
    queryFn: async () => {
      const api = new AdvertsApi(config)
      return api.advertControllerFindAll()
    },
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {data?.map((advert) => (
        <div key={advert.id}>{advert.title}</div>
      ))}
    </div>
  )
}
```

## Environment Variables

### APIs (.env)

```bash
# Main API
OFFICIAL_JOURNAL_API_PORT=4000

# Admin API
OFFICIAL_JOURNAL_ADMIN_API_PORT=4001

# Application API
OFFICIAL_JOURNAL_APPLICATION_API_PORT=4002

# Shared
DATABASE_URL=postgresql://user:password@localhost:5432/official-journal
JWT_SECRET=your-secret-here
REDIS_URL=redis://localhost:6379
```

### Web App (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

## Related Skills

- **[/nestjs-controller](../../skills/nestjs-controller/SKILL.md)** - Create NestJS endpoints
- **[/database-migrations](../../skills/database-migrations/SKILL.md)** - Create migrations
- **[/unit-tests](../../skills/unit-tests/SKILL.md)** - Generate tests
- **[/codegen](../../skills/codegen/SKILL.md)** - Regenerate API client

## Related Conventions

- **[Logging](../../conventions/logging.md)** - Which logger to use
- **[NestJS](../../conventions/nestjs.md)** - NestJS patterns
- **[Next.js](../../conventions/nextjs.md)** - Next.js patterns (Pages Router section)
- **[Testing](../../conventions/testing.md)** - Testing patterns
- **[Imports](../../conventions/imports.md)** - Import conventions

## Additional Resources

- **Main API Swagger**: http://localhost:4000/api/documentation
- **Admin API Swagger**: http://localhost:4001/api/documentation
- **Application API Swagger**: http://localhost:4002/api/documentation
- **Web App**: http://localhost:3000
