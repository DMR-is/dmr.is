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
