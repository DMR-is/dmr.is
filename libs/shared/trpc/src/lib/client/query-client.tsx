import { forceLogin } from '@dmr.is/auth/useLogOut'

import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query'
import { TRPCClientError } from '@trpc/react-query'

export const makeQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry(failureCount, error) {
          if (error instanceof TRPCClientError) {
            if (error.data.httpStatus === 404) {
              return false
            }
          }

          if (error.message === 'UNAUTHORIZED') {
            return false
          } else if (error.message === 'No session found') {
            // Force login when no session is found
            if (typeof window !== 'undefined') {
              forceLogin(window.location.pathname)
            }

            return false
          }
          return failureCount < 3
        },
      },
      dehydrate: {
        shouldDehydrateQuery: (query) => {
          const shouldDehydrate = defaultShouldDehydrateQuery(query)
          const isPending = query.state.status === 'pending'
          return shouldDehydrate || isPending
        },
        shouldRedactErrors: (_error) => {
          // We should not catch Next.js server errors
          // as that's how Next.js detects dynamic pages
          // so we cannot redact them.
          // Next.js also automatically redacts errors for us
          // with better digests.
          return false
        },
      },
    },
  })
}
