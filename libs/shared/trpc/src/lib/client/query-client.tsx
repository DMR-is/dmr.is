import { forceLogin } from '@dmr.is/auth/useLogOut'

import {
  defaultShouldDehydrateQuery,
  MutationCache,
  QueryClient,
} from '@tanstack/react-query'
import { TRPCClientError } from '@trpc/react-query'

/**
 * A dead session makes every in-flight call fail at once, and each failure would
 * otherwise kick off its own redirect to IDS. Only the first one is allowed to.
 */
let redirectingToLogin = false

const isUnauthorized = (error: unknown): boolean => {
  if (error instanceof TRPCClientError && error.data?.httpStatus === 401) {
    return true
  }

  if (error instanceof Error) {
    return (
      error.message === 'UNAUTHORIZED' || error.message === 'No session found'
    )
  }

  return false
}

/**
 * Bounces the user through IDS when the session behind the request is gone.
 *
 * The session cookie can die mid-session (expired tokens the middleware could
 * not refresh), and nothing about the loaded page reflects that — so without
 * this the user keeps clicking on a UI that answers 401 to everything.
 *
 * @returns whether the error was an auth failure, so callers can skip retrying.
 */
const forceLoginOnUnauthorized = (error: unknown): boolean => {
  if (!isUnauthorized(error)) {
    return false
  }

  if (typeof window !== 'undefined' && !redirectingToLogin) {
    redirectingToLogin = true
    forceLogin(window.location.pathname)
  }

  return true
}

export const makeQueryClient = () => {
  return new QueryClient({
    // Mutations need the same 401 handling as queries, but a default
    // `mutations.onError` would be overwritten by any mutation passing its own
    // (which most of them do, for toasts). The cache-level callback always runs.
    mutationCache: new MutationCache({
      onError: (error) => {
        forceLoginOnUnauthorized(error)
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry(failureCount, error) {
          if (error instanceof TRPCClientError) {
            if (error.data?.httpStatus === 404) {
              return false
            }
          }

          if (forceLoginOnUnauthorized(error)) {
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
