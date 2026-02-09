/* eslint-disable @typescript-eslint/no-explicit-any */

import { handleException } from '@dmr.is/utils/serverUtils'

export function HandleException() {
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
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error(err.message)
        }

        return handleException({
          service: service,
          method: method,
          error: err,
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
