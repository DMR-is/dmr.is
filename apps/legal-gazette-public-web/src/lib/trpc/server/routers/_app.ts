import { router } from '../trpc'
import { publicationRouter } from './publicationRouter'

export const appRouter = router({
  publicationApi: publicationRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
