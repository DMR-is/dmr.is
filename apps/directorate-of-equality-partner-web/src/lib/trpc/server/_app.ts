import { apiKeyRouter } from './routers/apiKeyRouter'
import { companyRouter } from './routers/companyRouter'
import { delegationRouter } from './routers/delegationRouter'
import { identityRouter } from './routers/identityRouter'
import { partnerClientRouter } from './routers/partnerClientRouter'
import { router } from './trpc'

export const appRouter = router({
  apiKey: apiKeyRouter,
  company: companyRouter,
  delegation: delegationRouter,
  identity: identityRouter,
  partnerClient: partnerClientRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
