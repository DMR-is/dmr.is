import { logger } from '@dmr.is/logging'
import { ResultWrapper } from '@dmr.is/types'
import {
  BaseError,
  Transaction,
  DatabaseError,
  ValidationError,
} from 'sequelize'
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

  if (error instanceof BaseError) {
    logger.debug(`Sequelize error ${error.name} in ${category}.${method}`, {
      method,
      category,
    })

    if (error instanceof DatabaseError) {
      logger.warn(
        `${error.name} in ${category}.${method}, reason: ${error.message}`,
      )

      return ResultWrapper.err({
        code: 500,
        message: 'Database error',
      })
    }

    if (error instanceof ValidationError) {
      error.errors.forEach((err) => {
        logger.debug(
          `Validation failed for ${err.path}: received ${err.value}. Reason: ${err.message}`,
        )
      })

      return ResultWrapper.err({
        code: 400,
        message: 'Validation failed',
      })
    }
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
    logger.error(`Error in ${category}.${method}: ${error.message}`, {
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

  logger.error(`Unknown error in ${category}.${method}`, {
    error: error,
  })

  return ResultWrapper.err({
    code: code,
    message: message,
  })
}

/**
 * Filters out arguments that are instances of Transaction or Buffer
 * @param args arguments to filter
 * @returns
 */
export const filterArgs = (args: any[], service?: string, method?: string) => {
  const filteredArgs = args.filter((arg) => {
    const isTransaction = arg instanceof Transaction
    const isBuffer = Buffer.isBuffer(arg?.buffer) // filter out arguments with buffer / files

    if (Array.isArray(arg)) {
      const isTransactionOrBuffer = arg.filter((a) => {
        const isTransaction = a instanceof Transaction
        const isBuffer = Buffer.isBuffer(a?.buffer) // filter out arguments with buffer / files

        if (isBuffer && service && method) {
          logger.debug(
            `${service}.${String(method)}: received buffer as argument`,
          )
        }

        return !isTransaction && !isBuffer
      })

      return !isTransactionOrBuffer
    }

    return !isTransaction && !isBuffer
  })

  return filteredArgs
}
