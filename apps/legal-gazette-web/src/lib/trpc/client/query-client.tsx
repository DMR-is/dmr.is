import { trpc } from './index'

import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query'
import { httpBatchLink, httpLink, splitLink } from '@trpc/client'

function getBaseUrl() {
  if (typeof window !== 'undefined') return '' // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // SSR should use vercel url
  return `http://localhost:${process.env.LG_WEB_PORT ?? 4202}` // dev SSR should use localhost
}

export const makeQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) => {
          return (
            defaultShouldDehydrateQuery(query) ||
            query.state.status === 'pending'
          )
        },
      },
    },
  })
}

export const makeTrpcClient = () => {
  return trpc.createClient({
    links: [
      splitLink({
        condition(op) {
          return op.path === 'getUser'
        },
        true: httpLink({ url: `${getBaseUrl()}/api/trpc` }),
        false: httpBatchLink({ url: `${getBaseUrl()}/api/trpc` }),
      }),
    ],
  })
}
