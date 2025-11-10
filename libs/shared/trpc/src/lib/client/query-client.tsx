import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query'

export const makeQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry(failureCount, error) {
          if (error.message === 'UNAUTHORIZED') {
            return false
          }
          return failureCount < 3
        },
      },
      dehydrate: {
        shouldDehydrateQuery: (query) => {
          return defaultShouldDehydrateQuery(query)
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
