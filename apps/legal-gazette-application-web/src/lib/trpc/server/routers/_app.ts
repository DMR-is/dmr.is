import { router } from '../trpc'
import { applicationRouter } from './applicationRouter'

export const appRouter = router({
  applicationApi: applicationRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
