import { router } from '../trpc'
import { advertRouter } from './advertRouter'
import { applicationRouter } from './applicationRouter'
import { nationalRegistryRouter } from './nationalRegistryRouter'
import { publicationRouter } from './publicationRouter'

export const appRouter = router({
  applicationApi: applicationRouter,
  publicationApi: publicationRouter,
  advertsApi: advertRouter,
  nationalRegistryApi: nationalRegistryRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
