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
          logger.debug(`${service}.${method}`)
        }

        Object.assign(logData, {
          ...filteredArgs,
        })

        logger.debug(`${service}.${method}`, {
          ...logData,
        })
        return await originalMethod.apply(this, args)
      } catch (error) {
        return handleException({
          service: service,
          method: method,
          error: error,
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
