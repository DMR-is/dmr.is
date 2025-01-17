/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@dmr.is/logging'
const LOGGING_CONTEXT = 'TimeLogger'

export function TimeLog() {
  return function (
    target: any,
    method: string,
    descriptor: PropertyDescriptor,
  ) {
    const service = target.constructor.name
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const start = Date.now()
      const results = originalMethod.apply(this, args)

      if (results instanceof Promise) {
        await results
      }

      const end = Date.now()

      const duration = end - start

      logger.info(`${service}.${method} executed in ${duration}ms`, {
        context: LOGGING_CONTEXT,
        service,
        method,
        time: `${duration}ms`,
      })

      return results
    }
    return descriptor
  }
}
