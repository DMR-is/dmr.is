import { problemMessages } from './messages'
import { Problem, ProblemType, ProblemVariant } from './Problem'

type ProblemFromErrorProps = {
  error: Error | unknown
  variant?: ProblemVariant
  titleSize?: 'h1' | 'h2' | 'h3'
}

/**
 * Maps an error to the appropriate Problem component
 * Handles various error types including tRPC errors, HTTP errors, and standard errors
 */
export const ProblemFromError = ({
  error,
  variant,
  titleSize,
}: ProblemFromErrorProps) => {
  // Extract error details
  const errorInfo = extractErrorInfo(error)

  return (
    <Problem
      type={errorInfo.type}
      variant={variant}
      title={errorInfo.title}
      message={errorInfo.message}
      statusCode={errorInfo.statusCode}
      titleSize={titleSize}
    />
  )
}

interface ErrorInfo {
  type: ProblemType
  title?: string
  message?: string
  statusCode?: number
}

/**
 * Extracts error information from various error types
 */
function extractErrorInfo(error: unknown): ErrorInfo {
  // Handle null/undefined
  if (!error) {
    return {
      type: 'server-error',
      ...problemMessages.errors.unknown,
    }
  }

  // Handle tRPC errors
  if (isTRPCError(error)) {
    return mapTRPCError(error)
  }

  // Handle HTTP errors with status codes
  if (isHTTPError(error)) {
    return mapHTTPError(error)
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return mapStandardError(error)
  }

  // Fallback for unknown error types
  return {
    type: 'server-error',
    ...problemMessages.errors.unknown,
  }
}

/**
 * Type guard for tRPC errors
 */
function isTRPCError(error: unknown): error is {
  data?: {
    code?: string
    httpStatus?: number
  }
  message?: string
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof (error as { data?: unknown }).data === 'object'
  )
}

/**
 * Maps tRPC errors to Problem types
 */
function mapTRPCError(error: {
  data?: { code?: string; httpStatus?: number }
  message?: string
}): ErrorInfo {
  const code = error.data?.code
  const statusCode = error.data?.httpStatus

  switch (code) {
    case 'NOT_FOUND':
      return {
        type: 'not-found',
        ...problemMessages.errors.trpc.notFound,
        statusCode: statusCode || 404,
      }

    case 'BAD_REQUEST':
    case 'PARSE_ERROR':
      return {
        type: 'bad-request',
        ...problemMessages.errors.trpc.badRequest,
        statusCode: statusCode || 400,
      }

    case 'UNAUTHORIZED':
    case 'FORBIDDEN':
      return {
        type: 'server-error',
        ...problemMessages.errors.trpc.unauthorized,
        statusCode: statusCode || 403,
      }

    case 'INTERNAL_SERVER_ERROR':
    case 'TIMEOUT':
      return {
        type: 'server-error',
        ...problemMessages.errors.trpc.internalError,
        statusCode: statusCode || 500,
      }

    default:
      return {
        type: 'server-error',
        ...problemMessages.errors.trpc.default,
        statusCode: statusCode || 500,
      }
  }
}

/**
 * Type guard for HTTP errors
 */
function isHTTPError(error: unknown): error is {
  status?: number
  statusCode?: number
  response?: { status?: number }
  message?: string
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('status' in error ||
      'statusCode' in error ||
      ('response' in error &&
        typeof (error as { response?: unknown }).response === 'object'))
  )
}

/**
 * Maps HTTP errors to Problem types based on status codes
 */
function mapHTTPError(error: {
  status?: number
  statusCode?: number
  response?: { status?: number }
  message?: string
}): ErrorInfo {
  const statusCode =
    error.status ||
    error.statusCode ||
    (error.response as { status?: number })?.status ||
    500

  if (statusCode === 404) {
    return {
      type: 'not-found',
      ...problemMessages.errors.http.notFound,
      statusCode,
    }
  }

  if (statusCode >= 400 && statusCode < 500) {
    return {
      type: 'bad-request',
      ...problemMessages.errors.http.badRequest,
      statusCode,
    }
  }

  if (statusCode >= 500) {
    return {
      type: 'server-error',
      ...problemMessages.errors.http.serverError,
      statusCode,
    }
  }

  return {
    type: 'server-error',
    ...problemMessages.errors.http.default,
    statusCode,
  }
}

/**
 * Maps standard Error objects to Problem types
 */
function mapStandardError(error: Error): ErrorInfo {
  const message = error.message.toLowerCase()

  // Check for network errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout')
  ) {
    return {
      type: 'server-error',
      ...problemMessages.errors.patterns.network,
    }
  }

  // Check for not found patterns
  if (message.includes('not found') || message.includes('404')) {
    return {
      type: 'not-found',
      ...problemMessages.errors.patterns.notFound,
      statusCode: 404,
    }
  }

  // Check for validation/bad request patterns
  if (
    message.includes('invalid') ||
    message.includes('validation') ||
    message.includes('bad request')
  ) {
    return {
      type: 'bad-request',
      ...problemMessages.errors.patterns.validation,
      statusCode: 400,
    }
  }

  // Default to server error
  return {
    type: 'server-error',
    ...problemMessages.errors.patterns.default,
  }
}
