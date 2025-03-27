// lib/api/middleware/handleAuthErrors.ts
import { signOut } from 'next-auth/react'

import { MiddlewareAPI } from './nodeFetch'

interface CreateAuthErrorMiddlewareOptions {
  fetch: MiddlewareAPI
}

export function createAuthErrorMiddleware({
  fetch,
}: CreateAuthErrorMiddlewareOptions): MiddlewareAPI {
  return async (request) => {
    const response = await fetch(request)

    if (!response.ok && response.status === 401) {
      try {
        const clone = response.clone()
        const data = await clone.json()
        const message = data?.message

        const isTokenInvalid =
          message === 'Invalid or expired token' ||
          (Array.isArray(message) &&
            message.includes('Invalid or expired token'))

        if (isTokenInvalid) {
          // eslint-disable-next-line no-console
          console.warn(
            '[Auth Middleware] Token invalid — triggering signOut()',
            {
              path: request.url,
              method: request.method,
            },
          )
          signOut({ callbackUrl: '/innskraning' })
        }
      } catch (err) {
        // silently fail if the body can't be parsed
      }
    }

    return response
  }
}
