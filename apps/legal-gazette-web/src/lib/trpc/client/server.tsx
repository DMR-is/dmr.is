import { getQueryClient } from '@dmr.is/trpc/client/server'

import { appRouter } from '../server/routers/_app'
import { createTRPCContext } from '../server/trpc'

import 'server-only' // <-- ensure this file cannot be imported from the client
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
})
