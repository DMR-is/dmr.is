/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseError, DatabaseError, ValidationError } from 'sequelize'
import { logger } from '@dmr.is/logging'
import { ResultWrapper } from '@dmr.is/types'
import { filterArgs } from '@dmr.is/utils'

import { HttpException } from '@nestjs/common'

type LogAndHandleOptions = {
  logArgs?: boolean
  message?: string
}

export const handleException = <T>({
  method,
  service,
  error,
  info,
  code = 500,
}: {
  method: string
  service: string
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
    logger.debug(`Sequelize error ${error.name} in ${service}.${method}`, {
      method,
      category: service,
    })

    if (error instanceof DatabaseError) {
      logger.warn(
        `${error.name} in ${service}.${method}, reason: ${error.message}`,
      )

      return ResultWrapper.err({
        code: 500,
        message: 'Internal server error',
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
    logger.warn(`${prefix} exception in ${service}.${method}`, {
      ...info,
      method,
      category: service,
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
    logger.error(`Error in ${service}.${method}: ${error.message}`, {
      ...info,
      method,
      category: service,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    })

    return ResultWrapper.err({
      code: code,
      message: error.message,
    })
  }

  logger.error(`Unknown error in ${service}.${method}`, {
    category: service,
    error: error,
  })

  return ResultWrapper.err({
    code: code,
    message: 'Internal server error',
  })
}

export function LogAndHandle(
  { logArgs, message }: LogAndHandleOptions = {
    logArgs: true,
    message: 'Internal server error',
  },
) {
  return function (
    target: any,
    method: string,
    descriptor: PropertyDescriptor,
  ) {
    const service = target.constructor.name
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      try {
        const filteredArgs = filterArgs(args, service, method)
        const logData = {
          context: `${service}`,
          method: method,
          category: service,
        }

        if (!logArgs) {
          logger.debug(`${method} called (skipped logging args)`, {
            context: `${service}`,
          })
        }

        if (logArgs) {
          Object.assign(logData, {
            ...filteredArgs,
          })
          logger.debug(`${method} called with arguments`, {
            ...logData,
          })
        }
        return await originalMethod.apply(this, args)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('error', error)
        }

        return handleException({
          service: service,
          method: method,
          error: error,
        })
      }
    }
    return descriptor
  }
}
