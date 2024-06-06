/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@dmr.is/logging'

export function Audit() {
  return function (
    target: any,
    method: string,
    descriptor: PropertyDescriptor,
  ) {
    const service = target.constructor.name
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      logger.info(`${service}.${method}`, {
        method: method,
        category: service,
        args: {
          ...args,
        },
      })
      return originalMethod.apply(this, args)
    }
    return descriptor
  }
}
