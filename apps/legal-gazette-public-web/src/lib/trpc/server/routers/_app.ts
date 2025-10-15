import { router } from '../trpc'
import { baseEntityRouter } from './baseEntityRouter'
import { publicationRouter } from './publicationRouter'
import { subscriberRouter } from './subscriberRouter'

export const appRouter = router({
  publicationApi: publicationRouter,
  subscriberApi: subscriberRouter,
  baseEntityApi: baseEntityRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
