import type { AppRouter } from '../server/routers/_app'

import { httpBatchLink, httpLink, splitLink } from '@trpc/client'

export const createLinks = (url: string) => [
  splitLink<AppRouter>({
    // The external payment service must not delay other queries in a batch.
    condition: (op) => op.path === 'getPaymentStatus',
    true: httpLink({ url }),
    false: httpBatchLink({ url }),
  }),
]
