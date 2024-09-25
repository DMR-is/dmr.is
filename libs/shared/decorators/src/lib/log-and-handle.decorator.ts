/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@dmr.is/logging'
import { filterArgs, handleException } from '@dmr.is/utils'

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
      const filteredArgs = filterArgs(args, service, method)
      try {
        const logData = {
          method: method,
          category: service,
        }

        if (!logArgs) {
          logger.info(`${service}.${method}`)
        }

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
              ...filteredArgs,
            },
          },
        })
      }
    }
    return descriptor
  }
}
