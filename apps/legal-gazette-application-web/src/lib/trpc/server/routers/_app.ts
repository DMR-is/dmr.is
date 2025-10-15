import { router } from '../trpc'
import { applicationRouter } from './applicationRouter'
import { publicationRouter } from './publicationRouter'

export const appRouter = router({
  applicationApi: applicationRouter,
  publicationApi: publicationRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
