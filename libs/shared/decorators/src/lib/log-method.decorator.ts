/* eslint-disable @typescript-eslint/no-explicit-any */
import { getLogger } from '@dmr.is/logging'
import { filterArgs } from '@dmr.is/utils-server/serverUtils'

export function LogMethod(logArgs: boolean | undefined = true) {
  return function (
    target: any,
    method: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const service = target.constructor.name
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      const logData = {
        method: method,
        category: service,
        context: `${service}`,
      }

      const filteredArgs = filterArgs(args, service, String(method))
      if (logArgs) {
        Object.assign(logData, filteredArgs)
      }

      const logger = getLogger(service)

      logger.info(`${String(method)} called with arguments`, {
        ...logData,
      })
      return originalMethod.apply(this, args)
    }
    return descriptor
  }
}

export function TestLogMethod(logArgs = true): MethodDecorator {
  return LogMethod(logArgs)
}
