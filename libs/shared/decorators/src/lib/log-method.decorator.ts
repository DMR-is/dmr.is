/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@dmr.is/logging'
import { filterArgs } from './utils'

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
      }

      const filteredArgs = filterArgs(args, service, String(method))
      if (logArgs) {
        Object.assign(logData, filteredArgs)
      }

      logger.info(`${service}.${String(method)}`, {
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
