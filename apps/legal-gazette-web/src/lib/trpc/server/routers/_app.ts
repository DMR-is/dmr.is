import { router } from '../trpc'
import { advertsRouter } from './advertsRouter'
import { baseEntityRouter } from './baseEntityRouter'
import { commentRouter } from './commentRouter'
import { publicationsRouter } from './publicationsRouter'
import { settlementRouter } from './settlementRouter'
import { usersRouter } from './usersRouter'

export const appRouter = router({
  adverts: advertsRouter,
  baseEntity: baseEntityRouter,
  users: usersRouter,
  publications: publicationsRouter,
  settlement: settlementRouter,
  commentsApi: commentRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
