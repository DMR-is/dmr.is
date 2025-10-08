import { router } from '../trpc'
import { advertsRouter } from './advertsRouter'
import { baseEntityRouter } from './baseEntityRouter'

export const appRouter = router({
  adverts: advertsRouter,
  baseEntity: baseEntityRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
