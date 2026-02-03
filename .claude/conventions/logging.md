# Logging Conventions

This guide explains which logger to use in different runtime environments across the DMR.is monorepo.

## Quick Decision Matrix

| Context | Logger Package | Reason |
|---------|---------------|--------|
| NestJS services/controllers | `@dmr.is/logging` | Full Winston features, file logging, Datadog APM |
| Next.js middleware | `@dmr.is/logging-next` | Edge Runtime compatible |
| Next.js Server Components | `@dmr.is/logging-next` | Universal compatibility |
| NextAuth callbacks | `@dmr.is/logging-next` | May run in Edge Runtime |
| Shared libraries (used by both) | `@dmr.is/logging-next` | Works in both Node.js and Edge |
| Official Journal Web | `@dmr.is/logging` | Pages Router, Node.js runtime only |

## Logger Packages

### @dmr.is/logging (Winston-based, Node.js only)

**Use for**: NestJS APIs running in Node.js runtime

**Features**:
- Winston-based with file transports
- Full NestJS integration
- Custom transports support
- Exception and rejection handling
- Datadog APM integration

**Example**:
```typescript
import { getLogger } from '@dmr.is/logging'

const logger = getLogger('CaseService')

logger.info('Processing case', { caseId, metadata })
logger.error('Validation failed', { error: err.message })
logger.warn('Deprecated API used', { endpoint })
```

**Available in**:
- `legal-gazette-api`
- `official-journal-api`
- `official-journal-admin-api`
- `official-journal-application-api`
- `regulations-api` (uses standard logger, not Winston)
- `official-journal-web` (Pages Router with Node.js runtime)

### @dmr.is/logging-next (Lightweight, Edge-compatible)

**Use for**: Next.js applications, especially those using App Router or middleware

**Features**:
- Zero dependencies (Edge Runtime compatible)
- Works in middleware, API routes, and server components
- JSON logging in production
- PII masking (national IDs automatically masked)
- Same API as `@dmr.is/logging` for easy migration

**Example**:
```typescript
import { getLogger } from '@dmr.is/logging-next'

const logger = getLogger('AuthMiddleware')

logger.info('Token refreshed', { userId })
logger.error('Authentication failed', { error })
```

**Required for**:
- `legal-gazette-web` (ESLint enforced)
- `legal-gazette-application-web` (ESLint enforced)
- `legal-gazette-public-web` (ESLint enforced)
- Any code that may run in Edge Runtime

## ESLint Enforcement

Legal Gazette Next.js apps have ESLint rules preventing incorrect logger usage:

```yaml
# legal-gazette-web/.eslintrc.yml
rules:
  no-restricted-imports:
    - error
    - patterns:
      - pattern: '@dmr.is/logging'
        message: 'Use @dmr.is/logging-next in Next.js apps (Edge Runtime compatible)'
```

## Common Patterns

### NestJS Service

```typescript
import { Injectable } from '@nestjs/common'
import { getLogger } from '@dmr.is/logging'

@Injectable()
export class AdvertService {
  private readonly logger = getLogger(AdvertService.name)

  async create(dto: CreateAdvertDto) {
    this.logger.info('Creating advert', {
      type: dto.type,
      userId: dto.userId
    })

    try {
      const result = await this.advertModel.create(dto)
      this.logger.info('Advert created', { id: result.id })
      return result
    } catch (error) {
      this.logger.error('Failed to create advert', {
        error: error.message
      })
      throw error
    }
  }
}
```

### Next.js Middleware

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getLogger } from '@dmr.is/logging-next'

const logger = getLogger('Middleware')

export function middleware(request: NextRequest) {
  logger.info('Request received', {
    path: request.nextUrl.pathname
  })

  return NextResponse.next()
}
```

### Next.js Server Component

```typescript
import { getLogger } from '@dmr.is/logging-next'

const logger = getLogger('AdvertPage')

export default async function AdvertPage({
  params
}: {
  params: { id: string }
}) {
  logger.info('Fetching advert', { id: params.id })

  const advert = await getAdvert(params.id)

  if (!advert) {
    logger.warn('Advert not found', { id: params.id })
    notFound()
  }

  return <AdvertDetail advert={advert} />
}
```

## PII Masking

Both loggers automatically mask Icelandic national IDs (kennitölur):

```typescript
logger.info('User action', {
  kennitala: '1234567890'
})
// Logs: { kennitala: '******7890' }
```

**Never use `console.log` directly** - always use the appropriate logger to ensure PII protection.

## Migration from console.log

```typescript
// ❌ Wrong - no structured logging, no PII protection
console.log('Processing case', caseId)
console.error('Error:', error)

// ✅ Correct - structured, PII-safe
logger.info('Processing case', { caseId })
logger.error('Processing failed', { error: error.message })
```

## Troubleshooting

### Error: "getLogger is not a function" in Next.js

**Cause**: Using `@dmr.is/logging` in Edge Runtime

**Solution**: Switch to `@dmr.is/logging-next`:
```typescript
// Change this:
import { getLogger } from '@dmr.is/logging'

// To this:
import { getLogger } from '@dmr.is/logging-next'
```

### ESLint Error: "Use @dmr.is/logging-next"

**Cause**: Importing `@dmr.is/logging` in a Legal Gazette Next.js app

**Solution**: Use `@dmr.is/logging-next` as indicated in the error message

### Logs Not Appearing in Development

**Cause**: Logger level too high or incorrect configuration

**Solution**: Check environment variables:
```bash
# .env.local
LOG_LEVEL=debug
```

## When to Use Each Logger

### Use @dmr.is/logging when:
- Building NestJS services/controllers
- Need file-based logging
- Working in Node.js-only runtime
- Building Official Journal Web (Pages Router)

### Use @dmr.is/logging-next when:
- Building Next.js App Router applications
- Writing middleware
- Code may run in Edge Runtime
- Building shared libraries used by both APIs and web apps
- Working on any Legal Gazette Next.js app

### Never use console.log when:
- Logging user data (PII risk)
- Production code
- Structured logging needed

---

**Related Documentation**:
- [NestJS Conventions](./nestjs.md)
- [Next.js Conventions](./nextjs.md)
- [Legal Gazette Apps](../apps/legal-gazette/CLAUDE.md)
- [Official Journal Apps](../apps/official-journal/CLAUDE.md)
