/* eslint-disable @typescript-eslint/no-explicit-any */

import { logger } from '@dmr.is/logging'

export function HandleApiException(
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
        if (process.env.NODE_ENV === 'development') {
          console.log(error)
        }

        const req = args[0]
        const res = args[1]

        logger.error(`${service}.${method}`, {
          error,
          method,
          category: service,
          url: req.url,
          body: req.body,
          query: req.query,
        })
        return res.status(500).json({
          message,
        })
      }
    }
    return descriptor
  }
}
