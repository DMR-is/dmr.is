import { notFound } from 'next/navigation'

import 'server-only' // <-- ensure this file cannot be imported from the client
import { TRPC_ERROR_CODE_KEY } from '@trpc/server'

/**
 * Custom error class that mimics TRPCError structure.
 * This is necessary because instanceof checks fail across different bundled copies
 * of @trpc/server in a monorepo. tRPC's internal error handling checks for:
 * 1. error instanceof TRPCError (fails across bundles)
 * 2. error instanceof Error && error.name === 'TRPCError' (this works!)
 *
 * By setting name = 'TRPCError' and having a 'code' property, tRPC will
 * properly recognize this error and preserve the error code.
 */
export class ApiTRPCError extends Error {
  public readonly code: TRPC_ERROR_CODE_KEY
  public readonly cause: unknown

  constructor(opts: {
    code: TRPC_ERROR_CODE_KEY
    message: string
    cause?: unknown
  }) {
    super(opts.message)
    this.name = 'TRPCError' // Critical: tRPC checks for this name
    this.code = opts.code
    this.cause = opts.cause

    // Ensure prototype chain is correct for instanceof Error checks
    Object.setPrototypeOf(this, ApiTRPCError.prototype)
  }
}

export const HTTP_CODE_TO_TRPC_ERROR_CODE: Record<number, TRPC_ERROR_CODE_KEY> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  402: 'PAYMENT_REQUIRED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_SUPPORTED',
  408: 'TIMEOUT',
  409: 'CONFLICT',
  412: 'PRECONDITION_FAILED',
  413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  422: 'UNPROCESSABLE_CONTENT',
  428: 'PRECONDITION_REQUIRED',
  429: 'TOO_MANY_REQUESTS',
  499: 'CLIENT_CLOSED_REQUEST',
  500: 'INTERNAL_SERVER_ERROR',
  501: 'NOT_IMPLEMENTED',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
  504: 'GATEWAY_TIMEOUT',
} as const

// Valid tRPC error codes for validation
const TRPC_ERROR_CODES = new Set([
  'PARSE_ERROR',
  'BAD_REQUEST',
  'INTERNAL_SERVER_ERROR',
  'NOT_IMPLEMENTED',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'METHOD_NOT_SUPPORTED',
  'TIMEOUT',
  'CONFLICT',
  'PRECONDITION_FAILED',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'UNPROCESSABLE_CONTENT',
  'TOO_MANY_REQUESTS',
  'CLIENT_CLOSED_REQUEST',
])

/**
 * Type guard that checks for TRPCError-like objects.
 * Using duck typing instead of instanceof to handle bundling differences in monorepos.
 * Checks for valid tRPC error code instead of just name property.
 */
function isTRPCError(
  error: unknown,
): error is { code: string; message: string; cause?: unknown; name?: string } {
  if (error === null || typeof error !== 'object') return false

  const errorObj = error as Record<string, unknown>

  // Check if it has a valid tRPC error code
  if ('code' in errorObj && typeof errorObj.code === 'string') {
    // Either name is 'TRPCError' OR code is a valid TRPC error code
    if (errorObj.name === 'TRPCError') return true
    if (TRPC_ERROR_CODES.has(errorObj.code)) return true
  }

  return false
}

/**
 * Recursively search for a TRPCError in the error chain.
 * Handles cases where tanstack-query or other libraries wrap the error.
 */
function findTRPCErrorInChain(
  error: unknown,
  depth = 0,
): { code: string; message: string; cause?: unknown } | null {
  if (depth > 5) return null // Prevent infinite loops

  if (isTRPCError(error)) {
    return error
  }

  // Check cause chain
  if (error && typeof error === 'object' && 'cause' in error) {
    return findTRPCErrorInChain(
      (error as { cause: unknown }).cause,
      depth + 1,
    )
  }

  return null
}

/**
 * Recursively search for Response status in any object (including cause chains)
 * Handles deeply nested structures where Response might be wrapped multiple times
 */
function findStatusDeep(obj: unknown, depth = 0): number | null {
  if (depth > 10 || obj === null || typeof obj !== 'object') return null

  // Check direct status property
  const directStatus = getResponseStatus(obj)
  if (directStatus !== null) return directStatus

  // Check cause chain
  if ('cause' in obj) {
    const causeStatus = findStatusDeep((obj as { cause: unknown }).cause, depth + 1)
    if (causeStatus !== null) return causeStatus
  }

  return null
}

export function handleTRPCError(error: unknown): never {
  // Check for Response status anywhere in the error structure
  // This handles cases where tRPC wraps our TRPCError due to instanceof failures
  const status = findStatusDeep(error)
  if (status === 404) {
    notFound()
  }

  // Search for TRPCError in the error chain
  const trpcError = findTRPCErrorInChain(error)
  if (trpcError) {
    if (trpcError.code === 'NOT_FOUND') {
      notFound()
    }
    throw trpcError.cause ?? trpcError
  }

  // Re-throw original error
  throw error
}

/**
 * Type guard to check if error is a Response-like object.
 * Handles both native Response and node-fetch Response objects.
 */
function isResponseLike(error: unknown): error is Response {
  if (error === null || typeof error !== 'object') return false

  // Check for Response instance
  if (typeof Response !== 'undefined' && error instanceof Response) {
    return true
  }

  // Check for node-fetch Response (has json method and status getter)
  const obj = error as Record<string, unknown>
  if (typeof obj.json === 'function' && typeof obj.status === 'number') {
    return true
  }

  // Check for symbol-based internals (node-fetch specific)
  const symbols = Object.getOwnPropertySymbols(error)
  const hasResponseInternals = symbols.some(
    (s) => s.toString().includes('Response internals'),
  )
  if (hasResponseInternals) {
    return true
  }

  return false
}

/**
 * Extract status from Response-like object (handles node-fetch)
 */
function getResponseStatus(error: unknown): number | null {
  if (error === null || typeof error !== 'object') return null

  // Try direct status property
  const obj = error as Record<string | symbol, unknown>
  if (typeof obj.status === 'number') {
    return obj.status
  }

  // Try symbol-based internals (node-fetch)
  const symbols = Object.getOwnPropertySymbols(error)
  for (const sym of symbols) {
    if (sym.toString().includes('Response internals')) {
      const internals = obj[sym] as Record<string, unknown> | undefined
      if (internals && typeof internals.status === 'number') {
        return internals.status
      }
    }
  }

  return null
}

export async function createTRPCError(error: unknown): Promise<ApiTRPCError> {
  // Pass through existing ApiTRPCError
  if (error instanceof ApiTRPCError) {
    return error
  }

  // Also check for TRPCError-like objects (bundling issues)
  if (isTRPCError(error)) {
    return new ApiTRPCError({
      code: error.code as TRPC_ERROR_CODE_KEY,
      message: error.message,
      cause: error.cause,
    })
  }

  // Handle Response objects (thrown by OpenAPI client)
  if (isResponseLike(error)) {
    // Get status from Response (handles node-fetch symbol properties)
    const status = getResponseStatus(error) ?? 500
    const trpcErrorCode =
      HTTP_CODE_TO_TRPC_ERROR_CODE[
        status as keyof typeof HTTP_CODE_TO_TRPC_ERROR_CODE
      ] ?? 'INTERNAL_SERVER_ERROR'

    // Try to parse response body for message/details
    let message = 'Unknown error'
    let cause: unknown = { status }

    try {
      // Clone response if possible to avoid body consumption issues
      const response =
        typeof error.clone === 'function' ? error.clone() : error
      const body = await response.json()
      cause = body

      // Extract message from API error format
      if (body && typeof body === 'object') {
        const apiError = body as { details?: string[]; message?: string }
        message =
          (apiError.details && apiError.details.length > 0
            ? apiError.details[0]
            : apiError.message) ?? message
      }
    } catch {
      // JSON parsing failed, use generic message
      message = `API Error (${status})`
    }

    return new ApiTRPCError({
      code: trpcErrorCode,
      message,
      cause,
    })
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return new ApiTRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message,
      cause: error,
    })
  }

  // Unknown error type
  return new ApiTRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    cause: error,
  })
}

export async function trpcProcedureHandler<T>(
  procedure: () => Promise<T>,
): Promise<T> {
  try {
    const result = await procedure()
    return result
  } catch (error) {
    const trpcError = await createTRPCError(error)
    throw trpcError
  }
}

/**
 * tRPC middleware that converts API errors (Response objects) to TRPCError.
 * The OpenAPI client throws raw Response objects on non-2xx status codes.
 *
 * Usage:
 * ```typescript
 * export const protectedProcedure = publicProcedure
 *   .use(authMiddleware)
 *   .use(apiErrorMiddleware)
 * ```
 */
export const apiErrorMiddleware = async <T>(opts: {
  next: () => Promise<{ ok: boolean; error?: any; [key: string]: any }>
}): Promise<T> => {
  const result = await opts.next()

  if (!result.ok && result.error?.cause) {
    // Extract status from Response internals in the cause
    const status = getResponseStatus(result.error.cause)

    if (status !== null) {
      const trpcCode = HTTP_CODE_TO_TRPC_ERROR_CODE[status] ?? 'INTERNAL_SERVER_ERROR'

      // Create new error with correct code
      const newError = new Error(result.error.message || `API Error (${status})`) as any
      newError.name = 'TRPCError'
      newError.code = trpcCode
      newError.cause = result.error.cause

      return { ...result, error: newError } as T
    }
  }

  return result as T
}
