/* eslint-disable @typescript-eslint/no-explicit-any */

import { logger } from '@dmr.is/logging'
import { isResponse } from '@dmr.is/utils/server/serverUtils'

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
        const req = args[0]
        const res = args[1]

        if (isResponse(error)) {
          let errorResponse
          const contentType = error.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            errorResponse = await error.json()
          } else {
            errorResponse = await error.text()
          }

          logger.error(`${service}.${method}`, {
            error: {
              name: errorResponse.name,
              message: errorResponse.message,
              stack: errorResponse.stack,
            },
            method,
            category: service,
            url: req.url,
            body: req.body,
            query: req.query,
          })

          return res.status(error.status).json({
            message: errorResponse.message,
            code: errorResponse.code,
          })
        }

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
