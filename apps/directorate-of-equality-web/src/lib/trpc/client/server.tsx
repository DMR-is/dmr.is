import { getQueryClient } from '@dmr.is/trpc/client/server'

import { appRouter } from '../server/routers/_app'
import { createTRPCContext } from '../server/trpc'

import 'server-only'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
})
