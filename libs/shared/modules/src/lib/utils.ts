import { logger } from '@dmr.is/logging'

import { BadRequestException, NotFoundException } from '@nestjs/common'

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
  if (error instanceof NotFoundException) {
    logger.warn(`Not found exception in ${category}.${method}`, {
      ...info,
      method,
      category,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    })

    return {
      ok: false,
      error: {
        code: error.getStatus(),
        message: error.message,
      },
    }
  }

  if (error instanceof BadRequestException) {
    logger.warn(`Bad request exception in ${category}.${method}`, {
      ...info,
      method,
      category,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    })

    return {
      ok: false,
      error: {
        code: error.getStatus(),
        message: error.message,
      },
    }
  }

  if (error instanceof Error) {
    logger.error(`Error in ${category}.${method}`, {
      ...info,
      category,
      method,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    })

    return {
      ok: false,
      error: {
        code: code,
        message: message,
      },
    }
  }

  logger.error(`Error in ${category}.${method}`, {
    ...info,
    category,
    method,
    error,
  })

  return {
    ok: false,
    error: {
      code: code,
      message: message,
    },
  }
}
