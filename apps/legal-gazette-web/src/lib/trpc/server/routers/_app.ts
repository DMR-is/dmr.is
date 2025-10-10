import { router } from '../trpc'
import { advertsRouter } from './advertsRouter'
import { baseEntityRouter } from './baseEntityRouter'
import { publicationsRouter } from './publicationsRouter'
import { usersRouter } from './usersRouter'

export const appRouter = router({
  adverts: advertsRouter,
  baseEntity: baseEntityRouter,
  users: usersRouter,
  publications: publicationsRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
