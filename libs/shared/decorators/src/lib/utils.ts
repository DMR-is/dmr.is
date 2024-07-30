import { logger } from '@dmr.is/logging'
import { ResultWrapper } from '@dmr.is/types'

import { HttpException } from '@nestjs/common'

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
}): ResultWrapper<T> => {
  let prefix = 'Error occurred'

  switch (code) {
    case 400:
      prefix = 'Bad request'
      break
    case 404:
      prefix = 'Not found'
      break
    case 405:
      prefix = 'Method not allowed'
      break
    default:
      prefix = 'Internal server error'
  }

  if (error instanceof HttpException) {
    logger.warn(`${prefix} exception in ${category}.${method}`, {
      ...info,
      method,
      category,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    })

    return ResultWrapper.err({
      code: error.getStatus(),
      message: error.message,
    })
  }

  if (error instanceof Error) {
    logger.error(`Error in ${category}.${method}`, {
      ...info,
      method,
      category,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    })

    return ResultWrapper.err({
      code: code,
      message: message,
    })
  }

  logger.error(`Error in ${category}.${method}`, {
    ...info,
    category,
    method,
    error,
  })

  return ResultWrapper.err({
    code: code,
    message: message,
  })
}
