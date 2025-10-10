import { router } from '../trpc'
import { advertRouter } from './advertRouter'
import { advertsRouter } from './advertsRouter'
import { baseEntityRouter } from './baseEntityRouter'

export const appRouter = router({
  advertsApi: advertsRouter,
  advertApi: advertRouter,
  baseEntity: baseEntityRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
