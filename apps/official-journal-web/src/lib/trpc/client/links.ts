import type { AppRouter } from '../server/routers/_app'

import { httpBatchLink, httpLink, splitLink } from '@trpc/client'

type ProcedurePath = keyof AppRouter['_def']['procedures'] & string

/**
 * The external payment service is slow enough to stall a whole batch, so these
 * procedures get a connection of their own. Typed against the router so renaming
 * a procedure breaks the build instead of silently re-batching it.
 */
const UNBATCHED_PROCEDURES: readonly ProcedurePath[] = ['getPaymentStatus']

export const createLinks = (url: string) => [
  splitLink<AppRouter>({
    condition: (op) =>
      (UNBATCHED_PROCEDURES as readonly string[]).includes(op.path),
    true: httpLink({ url }),
    false: httpBatchLink({ url }),
  }),
]
