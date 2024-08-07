/* eslint-disable @typescript-eslint/no-explicit-any */
import { Transaction } from 'sequelize'
import { handleException } from '../lib/utils'
import { logger } from '@dmr.is/logging'

type LogAndHandleOptions = {
  logArgs?: boolean
  message?: string
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
        const logData = {
          method: method,
          category: service,
        }

        if (!logArgs) {
          logger.info(`${service}.${method}`)
        }
        const filteredArgs = args.filter((arg) => !(arg instanceof Transaction))

        Object.assign(logData, {
          ...filteredArgs,
        })

        logger.info(`${service}.${method}`, {
          ...logData,
        })
        return await originalMethod.apply(this, args)
      } catch (error) {
        return handleException({
          category: service,
          method: method,
          error: error,
          message: message || 'Internal server error',
          info: {
            args: {
              ...args,
            },
          },
        })
      }
    }
    return descriptor
  }
}
