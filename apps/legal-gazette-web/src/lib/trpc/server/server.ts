import { AppRouter, appRouter } from './routers/_app'
import { createCallerFactory, createTRPCContext, getQueryClient } from './trpc'

import { createHydrationHelpers } from '@trpc/react-query/rsc'

export const getTrpcServer = async () => {
  const caller = createCallerFactory(appRouter)(await createTRPCContext())
  const { trpc, HydrateClient } = createHydrationHelpers<AppRouter>(
    caller,
    getQueryClient,
  )

  return { trpc, HydrateClient }
}
