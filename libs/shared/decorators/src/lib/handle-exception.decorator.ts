/* eslint-disable @typescript-eslint/no-explicit-any */
import { handleException } from '../lib/utils'

export function HandleException(
  message: string | undefined = 'Internal server error',
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
        return await originalMethod.apply(this, args)
      } catch (error) {
        return handleException({
          category: service,
          method: method,
          error: error,
          message: message,
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
