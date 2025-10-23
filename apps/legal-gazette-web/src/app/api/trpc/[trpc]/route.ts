import { appRouter } from '../../../../lib/nTrpc/server/routers/_app'
import { createTRPCContext } from '../../../../lib/nTrpc/server/trpc'

import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

const handler = async (req: Request) => {
  const response = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext(),
  })
  return response
}

export { handler as GET, handler as POST }
