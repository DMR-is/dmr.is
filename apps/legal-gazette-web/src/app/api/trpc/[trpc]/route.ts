import { createTRPCContext } from '../../../../lib/trpc/server/trpc'
import { appRouter } from '../../../../lib/trpc/server/routers/_app'

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
