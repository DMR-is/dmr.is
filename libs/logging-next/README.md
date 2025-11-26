# @dmr.is/logging-next

Edge Runtime-compatible logging library for Next.js applications.

## Overview

`@dmr.is/logging-next` is a lightweight, zero-dependency logging library designed to work in Next.js Edge Runtime environments (middleware, edge API routes, etc.) where Node.js-specific modules are not available.

## Features

- ✅ **Edge Runtime Compatible**: Works in Next.js middleware and edge functions
- ✅ **Zero Dependencies**: No external npm dependencies
- ✅ **PII Protection**: Automatic masking of Icelandic national IDs (kennitölur)
- ✅ **Structured Logging**: JSON output in production, readable format in development
- ✅ **Log Levels**: Support for debug, info, warn, and error levels
- ✅ **Categorized Logs**: Add categories/context to your logs
- ✅ **Type Safe**: Full TypeScript support
- ✅ **Configurable**: Control log levels via environment variables

## Installation

This library is part of the DMR monorepo and is available as `@dmr.is/logging-next`.

## Usage

### Basic Usage

```typescript
import { getLogger } from '@dmr.is/logging-next'

const logger = getLogger('my-component')

logger.debug('Debug message', { detail: 'some detail' })
logger.info('User logged in', { userId: '123' })
logger.warn('Rate limit approaching', { requests: 95, limit: 100 })
logger.error('Failed to fetch data', { error: 'Network timeout' })
```

### In Next.js Middleware

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getLogger } from '@dmr.is/logging-next'

const logger = getLogger('middleware')

export function middleware(request: NextRequest) {
  logger.info('Request received', {
    path: request.nextUrl.pathname,
    method: request.method,
  })

  return NextResponse.next()
}
```

### In NextAuth Callbacks

```typescript
import { getLogger } from '@dmr.is/logging-next'

const logger = getLogger('auth')

export const authOptions = {
  callbacks: {
    async jwt({ token }) {
      logger.info('JWT callback executed', { sub: token.sub })
      return token
    },
  },
}
```

### Child Loggers

Create child loggers with different categories:

```typescript
const parentLogger = getLogger('parent')
const childLogger = parentLogger.child({ category: 'child', context: 'child' })

childLogger.info('Message from child') // Logs with [child] category
```

## Configuration

### Log Levels

Control which logs are output using the `LOG_LEVEL` environment variable:

```bash
# Show all logs (default in development)
LOG_LEVEL=debug

# Show info, warn, and error (default in production)
LOG_LEVEL=info

# Show only warnings and errors
LOG_LEVEL=warn

# Show only errors
LOG_LEVEL=error
```

### Output Format

The logger automatically adjusts output format based on `NODE_ENV`:

**Development** (readable format):

```plaintext
2024-11-26T14:30:00.123Z [my-component] INFO: User logged in {"userId":"123"}
```

**Production** (JSON format):

```json
{"level":"info","message":"User logged in","timestamp":"2024-11-26T14:30:00.123Z","category":"my-component","context":"my-component","userId":"123"}
```

## PII Protection

The logger automatically masks Icelandic national IDs (kennitölur) in log messages:

```typescript
logger.info('User 123456-7890 performed action')
// Development: User **REMOVE_PII: 123456-7890** performed action
// Production:  User --MASKED-- performed action
```

This helps prevent accidental logging of personal information.

## API Reference

### `getLogger(category: string): Logger`

Creates a logger instance with the specified category.

- **category**: A string identifier for the logger (e.g., 'auth', 'middleware', 'api')
- **Returns**: Logger instance

### `createLogger(category?: string): Logger`

Creates a logger instance with optional category. Used internally by `getLogger`.

- **category**: Optional string identifier
- **Returns**: Logger instance

### Logger Methods

All logger methods accept a message string and optional metadata object:

#### `debug(message: string, meta?: Record<string, unknown>): void`

Log debug-level messages. Only shown when `LOG_LEVEL=debug`.

#### `info(message: string, meta?: Record<string, unknown>): void`

Log informational messages.

#### `warn(message: string, meta?: Record<string, unknown>): void`

Log warning messages.

#### `error(message: string, meta?: Record<string, unknown>): void`

Log error messages.

#### `child(context: { category: string; context: string }): Logger`

Create a child logger with a new category.

## When to Use

### Use `@dmr.is/logging-next` for

- ✅ Next.js middleware (Edge Runtime)
- ✅ Next.js edge API routes
- ✅ NextAuth callbacks
- ✅ Any code that runs in Edge Runtime
- ✅ Shared libraries used by both Next.js and NestJS

### Use `@dmr.is/logging` (Winston-based) for

- ✅ NestJS APIs and services
- ✅ Backend services running in Node.js
- ✅ Code that needs file logging or custom transports

## Type Definitions

```typescript
export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void
  info(message: string, meta?: Record<string, unknown>): void
  warn(message: string, meta?: Record<string, unknown>): void
  error(message: string, meta?: Record<string, unknown>): void
  child(context: { category: string; context: string }): Logger
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  category?: string
  context?: string
  [key: string]: unknown
}
```

## Comparison with @dmr.is/logging

| Feature | @dmr.is/logging-next | @dmr.is/logging (Winston) |
|---------|---------------------|---------------------------|
| Edge Runtime | ✅ Yes | ❌ No |
| Node.js | ✅ Yes | ✅ Yes |
| Dependencies | 0 | Multiple (Winston, etc.) |
| File output | ❌ No | ✅ Yes |
| Console output | ✅ Yes | ✅ Yes |
| JSON formatting | ✅ Yes | ✅ Yes |
| PII masking | ✅ Yes | ✅ Yes |
| Custom transports | ❌ No | ✅ Yes |
| Bundle size | ~2KB | ~200KB+ |

## Examples

### Logging with Metadata

```typescript
logger.info('Processing payment', {
  orderId: 'ORD-123',
  amount: 1500,
  currency: 'ISK',
})
```

### Logging Errors

```typescript
try {
  await riskyOperation()
} catch (error) {
  logger.error('Operation failed', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  })
}
```

### Conditional Logging

```typescript
const logger = getLogger('api')

if (response.status >= 400) {
  logger.error('API request failed', {
    status: response.status,
    url: response.url,
  })
} else {
  logger.info('API request succeeded', {
    status: response.status,
  })
}
```

## License

Internal DMR library - not published to npm.
