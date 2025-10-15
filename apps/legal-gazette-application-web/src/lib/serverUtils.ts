import { ApiErrorDto, ApiErrorDtoFromJSON } from '../gen/fetch'

import { TRPCError } from '@trpc/server'

type SafeCallReturn<T> =
  | {
      data: T
      error: null
    }
  | {
      data: null
      error: ApiErrorDto
    }

export async function safeCall<T>(
  call: () => Promise<T>,
): Promise<SafeCallReturn<T>> {
  try {
    const data = await call()

    return {
      data,
      error: null,
    }
  } catch (error) {
    const response = error as unknown as Response
    const json = await response.json()
    const errorDto = ApiErrorDtoFromJSON(json)

    return {
      data: null,
      error: errorDto,
    }
  }
}

export function getStatusFromTRPCError(error: TRPCError): number | null {
  const cause = (error.cause ?? {}) as any

  // Check if it's the Response object directly
  if (cause && typeof cause.status === 'number') {
    return cause.status
  }

  // Check for Response internals symbol
  const responseInternals =
    (cause && cause[Symbol.for('Response internals')]) ||
    (cause &&
      Object.getOwnPropertySymbols(cause).find((symbol) =>
        symbol.toString().includes('Response internals'),
      ))

  if (responseInternals && cause[responseInternals]) {
    return cause[responseInternals].status
  }

  // Try to find status in any symbol property
  if (cause && typeof cause === 'object') {
    const symbols = Object.getOwnPropertySymbols(cause)
    for (const symbol of symbols) {
      const value = cause[symbol]
      if (value && typeof value.status === 'number') {
        return value.status
      }
    }
  }

  return null
}
