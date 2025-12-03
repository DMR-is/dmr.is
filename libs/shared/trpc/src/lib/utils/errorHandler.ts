import { notFound } from 'next/navigation'

import 'server-only' // <-- ensure this file cannot be imported from the client
import { TRPCError } from '@trpc/server'
import { getHTTPStatusCodeFromError } from '@trpc/server/http'

export const HTTP_CODE_TO_TRPC_ERROR_CODE = {
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

export function handleTRPCError(error: unknown) {
  if (error instanceof TRPCError) {
    const status = getHTTPStatusCodeFromError(error)

    if (status === 404) {
      return notFound()
    }

    throw error.cause ?? error
  }

  throw error
}

export async function createTRPCError(error: unknown) {
  if (error instanceof TRPCError) {
    return error
  }
  try {
    const err = await (error as Response).json()
    const trpcErrorCode =
      HTTP_CODE_TO_TRPC_ERROR_CODE[
        err.statusCode as keyof typeof HTTP_CODE_TO_TRPC_ERROR_CODE
      ] ?? 'INTERNAL_SERVER_ERROR'
    return new TRPCError({
      code: trpcErrorCode,
      message: err.details && err.details.length ? err.details[0] : err.message,
      cause: err,
    })
  } catch (error) {
    return new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      cause: error,
    })
  }
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
