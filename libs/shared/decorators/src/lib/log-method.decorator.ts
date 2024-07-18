/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@dmr.is/logging'

export function LogMethod(logArgs: boolean | undefined = true) {
  return function (
    target: any,
    method: string,
    descriptor: PropertyDescriptor,
  ) {
    const service = target.constructor.name
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      const logData = {
        method: method,
        category: service,
      }

      if (logArgs) {
        Object.assign(logData, args)
      }

      logger.info(`${service}.${method}`, {
        ...logData,
      })
      return originalMethod.apply(this, args)
    }
    return descriptor
  }
}
