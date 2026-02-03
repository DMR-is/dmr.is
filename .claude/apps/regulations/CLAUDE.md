# Regulations (Reglugerðir) API

This guide covers the Regulations API, which manages Iceland's regulatory framework with temporal versioning.

## Overview

The Regulations API provides access to Iceland's regulations with full version history and temporal queries. Unlike other DMR.is APIs, it uses **Fastify** instead of NestJS.

### Application

**regulations-api** - Fastify-based API with temporal versioning (Port 3000)

## Technology Stack

- **Framework**: Fastify (NOT NestJS)
- **Build Tool**: Esbuild
- **Database**: PostgreSQL with temporal queries
- **Logger**: Standard logger (not Winston)
- **API Style**: REST with temporal versioning
- **Port**: 3000 (default)

## Key Differences from NestJS APIs

### Framework: Fastify

Regulations API uses Fastify, not NestJS. **Do not use NestJS patterns here.**

**Fastify Route Example**:
```typescript
import { FastifyPluginAsync } from 'fastify'

const regulationsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/regulations/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const regulation = await getRegulation(id)

    return reply.send(regulation)
  })

  fastify.post('/regulations', async (request, reply) => {
    const data = request.body as RegulationDto
    const regulation = await createRegulation(data)

    return reply.status(201).send(regulation)
  })
}

export default regulationsRoutes
```

**Key Differences**:
- Use `fastify.get/post/put/delete` instead of `@Get/@Post` decorators
- No dependency injection (DI)
- Use plugins instead of modules
- Route handlers are async functions
- Direct function imports instead of services

### No NestJS Patterns

| NestJS Pattern | Fastify Equivalent |
|----------------|-------------------|
| `@Controller()` | `fastify.register()` with route plugin |
| `@Get/@Post()` | `fastify.get/post()` |
| Services with DI | Direct function imports |
| Modules | Plugins |
| Guards | Hooks/Prehandler |
| Interceptors | Hooks |
| DTOs with decorators | Zod/Joi schemas |

### Logging

Regulations API uses a standard logger (not `@dmr.is/logging`):

```typescript
// ✅ Correct for Regulations API
import { logger } from './logger'

logger.info('Processing regulation', { id })
logger.error('Error occurred', { error: err.message })
```

**Not Winston-based** like other APIs.

## Getting Started

### Start API

```bash
yarn nx serve regulations-api
```

**Port**: 3000

### Development Mode

```bash
# Serve with watch mode
yarn nx serve regulations-api

# Build for production
yarn nx build regulations-api
```

## Temporal Versioning

The Regulations API's unique feature is **temporal versioning** - track regulations as they change over time.

### How It Works

Each regulation has:
- **Effective date**: When this version becomes active
- **Repeal date**: When this version is replaced (if any)
- **Version history**: Full audit trail of changes

### Querying by Date

**Get regulation at specific point in time**:

```typescript
GET /regulations/:id?effectiveDate=2024-01-15
```

Returns the version that was active on that date.

**Get all versions**:

```typescript
GET /regulations/:id/versions
```

Returns complete version history.

### Creating New Versions

When a regulation is amended:

1. **Keep old version** with `repealDate` set to when new version takes effect
2. **Create new version** with `effectiveDate` set to amendment date
3. **Link versions** via parent/child relationship

**Example**:
```typescript
// Old version (automatically updated)
{
  id: 'reg-1',
  version: 1,
  effectiveDate: '2020-01-01',
  repealDate: '2024-01-01', // New!
  text: 'Original regulation text'
}

// New version (created)
{
  id: 'reg-1',
  version: 2,
  effectiveDate: '2024-01-01',
  repealDate: null,
  text: 'Amended regulation text',
  previousVersion: 1
}
```

## API Routes

### Basic CRUD

```typescript
// Get regulation (latest version)
GET /regulations/:id

// Get regulation at specific date
GET /regulations/:id?effectiveDate=YYYY-MM-DD

// Get all versions
GET /regulations/:id/versions

// Create regulation
POST /regulations

// Update regulation (creates new version)
PUT /regulations/:id

// Delete regulation (sets repealDate)
DELETE /regulations/:id
```

### Search

```typescript
// Search regulations
GET /regulations?search=keyword

// Filter by effective date range
GET /regulations?from=2024-01-01&to=2024-12-31

// Filter by status
GET /regulations?status=active
```

## Data Schema

### Regulation Model

```typescript
interface Regulation {
  id: string
  version: number
  effectiveDate: string // ISO date
  repealDate?: string | null // ISO date
  title: string
  text: string
  ministry: string
  lawReference?: string
  previousVersion?: number
  createdAt: string
  updatedAt: string
}
```

## Validation

Use Zod for request validation:

```typescript
import { z } from 'zod'

const createRegulationSchema = z.object({
  title: z.string().min(3),
  text: z.string().min(10),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ministry: z.string(),
})

fastify.post('/regulations', async (request, reply) => {
  const data = createRegulationSchema.parse(request.body)
  const regulation = await createRegulation(data)

  return reply.status(201).send(regulation)
})
```

## Error Handling

```typescript
fastify.setErrorHandler((error, request, reply) => {
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
  })

  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation failed',
      details: error.validation,
    })
  }

  return reply.status(500).send({
    error: 'Internal server error',
  })
})
```

## Database Queries

### Temporal Queries

**Get regulation active on specific date**:

```sql
SELECT *
FROM regulations
WHERE id = $1
  AND effective_date <= $2
  AND (repeal_date IS NULL OR repeal_date > $2)
ORDER BY version DESC
LIMIT 1
```

**Get all versions of a regulation**:

```sql
SELECT *
FROM regulations
WHERE id = $1
ORDER BY version ASC
```

## Testing

```bash
# Run tests
yarn nx test regulations-api

# Run specific test file
yarn nx test regulations-api --testFile=apps/regulations-api/src/routes/regulations.spec.ts
```

**Testing with Fastify**:

```typescript
import { build } from './app'

describe('Regulations API', () => {
  let app

  beforeAll(async () => {
    app = await build()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should get regulation by id', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/regulations/reg-1',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveProperty('id', 'reg-1')
  })
})
```

## Common Pitfalls

### 1. Using NestJS Patterns

```typescript
// ❌ Wrong - NestJS decorator (doesn't work in Fastify)
@Controller('regulations')
@Get(':id')
async getRegulation() { }

// ✅ Correct - Fastify route
fastify.get('/regulations/:id', async (request, reply) => {
  // ...
})
```

### 2. Using NestJS Logger

```typescript
// ❌ Wrong - NestJS logger
import { getLogger } from '@dmr.is/logging'

// ✅ Correct - Regulations API logger
import { logger } from './logger'
```

### 3. Forgetting Temporal Aspect

```typescript
// ❌ Wrong - Only gets latest version
SELECT * FROM regulations WHERE id = $1

// ✅ Correct - Gets version active on specific date
SELECT *
FROM regulations
WHERE id = $1
  AND effective_date <= $2
  AND (repeal_date IS NULL OR repeal_date > $2)
```

### 4. Wrong Port

```bash
# ❌ Wrong - Legal Gazette port
curl http://localhost:4100/regulations/reg-1

# ✅ Correct - Regulations API port
curl http://localhost:3000/regulations/reg-1
```

## Common Workflows

### Adding a New Regulation Endpoint

1. **Create route plugin** in `src/routes/`
2. **Define Zod schema** for validation
3. **Add route handler** with Fastify
4. **Write tests** using `app.inject()`
5. **Register plugin** in main app

### Updating Versioning Logic

1. **Modify temporal query** logic
2. **Update database indexes** if needed
3. **Test with various date ranges**
4. **Document behavior** in API docs

## Environment Variables

```bash
REGULATIONS_API_PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/regulations
LOG_LEVEL=info
```

## Build and Deployment

### Build

Uses Esbuild (fast, modern bundler):

```bash
yarn nx build regulations-api
```

**Output**: `dist/apps/regulations-api/`

### Production

```bash
# Build first
yarn nx build regulations-api

# Start built version
node dist/apps/regulations-api/main.js
```

## Related Conventions

- **[Testing](../../conventions/testing.md)** - Testing patterns
- **[Imports](../../conventions/imports.md)** - Import conventions

## Additional Resources

- **API**: http://localhost:3000 (when running)
- **Fastify Documentation**: https://www.fastify.io/
- **Esbuild Documentation**: https://esbuild.github.io/

---

**Note**: This API is architecturally different from other DMR.is APIs. Always remember:
- Use **Fastify**, not NestJS
- Use **standard logger**, not `@dmr.is/logging`
- Use **Esbuild**, not webpack
- Focus on **temporal versioning** logic
