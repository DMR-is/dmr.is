import { logger } from '@dmr.is/logging'

import { Result } from '../types/result'

export const handleException = <T>({
  method,
  message,
  category,
  error,
  info,
  code = 500,
}: {
  method: string
  message: string
  category: string
  error: unknown
  info?: Record<string, unknown>
  code?: number
}): Result<T> => {
  if (error instanceof Error) {
    logger.error(`Error in ${method}`, {
      ...info,
      category,
      method,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    })
  } else {
    logger.error(`Error in ${method}`, {
      ...info,
      category,
      method,
      error,
    })
  }

  return {
    ok: false,
    error: {
      code: code,
      message: message,
    },
  }
}

export const handleBadRequest = <T>({
  method,
  message = 'Bad request',
  reason,
  category,
  info,
  code = 400,
}: {
  method: string
  message?: string
  reason?: string
  category: string
  info?: Record<string, unknown>
  code?: number
}): Result<T> => {
  logger.warn(`Bad request in ${method}${reason ? `, ${reason}` : ''}`, {
    ...info,
    category,
    method,
  })

  return {
    ok: false,
    error: {
      code: code,
      message,
    },
  }
}

export const handleNotFoundLookup = <T>({
  method,
  entity,
  id,
  category,
  info,
  code = 404,
}: {
  method: string
  entity: string
  id: string
  category: string
  info?: Record<string, unknown>
  code?: number
}): Result<T> => {
  logger.warn(`${method}, could not find ${entity}<${id}>`, {
    ...info,
    category,
    method,
  })

  return {
    ok: false,
    error: {
      code: code,
      message: 'Could not find ${entity}<${id}>',
    },
  }
}
