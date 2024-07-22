/* eslint-disable @typescript-eslint/no-explicit-any */
import { handleException } from '../lib/utils'

export function HandleException(message?: string | undefined) {
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
      } catch (err: any) {
        const msg = message ? message : 'Internal server error'

        if (process.env.NODE_ENV === 'development') {
          console.error(err.message)
        }

        return handleException({
          category: service,
          method: method,
          error: err,
          message: msg,
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
