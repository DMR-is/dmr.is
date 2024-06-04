import { logger } from '@dmr.is/logging'

import { Result } from '../types/result'

export const handleException = <T>({
  method,
  message,
  category,
  error,
  info,
}: {
  method: string
  message: string
  category: string
  error: unknown
  info?: Record<string, unknown>
}): Promise<Result<T>> => {
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

  return Promise.resolve({
    ok: false,
    error: {
      code: 500,
      message: message,
    },
  })
}

export const handleNotFoundLookup = <T>({
  method,
  entity,
  id,
  category,
  info,
}: {
  method: string
  entity: string
  id: string
  category: string
  info?: Record<string, unknown>
}): Promise<Result<T>> => {
  logger.warn(`${method}, could not find ${entity}<${id}>`, {
    ...info,
    category,
    method,
  })

  return Promise.resolve({
    ok: false,
    error: {
      code: 404,
      message: 'Could not find ${entity}<${id}>',
    },
  })
}
