import {
  FetchAPI as NodeFetchAPI,
  MiddlewareAPI,
  Request,
  RequestInfo,
  RequestInit,
} from './nodeFetch'
import { EnhancedFetchAPI } from './types'

export function buildFetch(actualFetch: NodeFetchAPI) {
  let nextMiddleware: MiddlewareAPI = actualFetch

  const result = {
    getFetch(): EnhancedFetchAPI {
      const firstMiddleware = nextMiddleware

      return async (input, init = {}, token?: string) => {
        // Normalize Request
        const request = new Request(input as RequestInfo, init as RequestInit)

        // If a token is provided, add it to the Authorization header
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }

        // Pass the request to the first middleware in the chain
        const response = await firstMiddleware(request)
        return response as unknown as Promise<Response>
      }
    },

    wrap<T extends { fetch: MiddlewareAPI }>(
      createFetch: (options: T) => MiddlewareAPI,
      options: Omit<T, 'fetch'>,
    ) {
      nextMiddleware = createFetch({ ...options, fetch: nextMiddleware } as T)
      return result
    },
  }
  return result
}
