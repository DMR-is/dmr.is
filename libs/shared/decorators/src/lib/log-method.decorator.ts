/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@dmr.is/logging'
import { Transaction } from 'sequelize'

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

      const filteredArgs = args.filter((arg) => {
        const isTransaction = arg instanceof Transaction
        const isBuffer = Buffer.isBuffer(arg.buffer) // filter out arguments with buffer / files

        if (Array.isArray(arg)) {
          const isTransactionOrBuffer = arg.filter((a) => {
            const isTransaction = a instanceof Transaction
            const isBuffer = Buffer.isBuffer(a.buffer) // filter out arguments with buffer / files

            if (isBuffer) {
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
