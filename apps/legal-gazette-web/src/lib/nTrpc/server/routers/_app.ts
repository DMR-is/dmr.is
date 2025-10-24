import { mergeRouters } from '../trpc'
import { advertsRouter } from './advertsRouter'
import { baseEntityRouter } from './baseEntityRouter'
import { commentRouter } from './commentRouter'
import { publicationsRouter } from './publicationsRouter'
import { settlementRouter } from './settlementRouter'
import { usersRouter } from './usersRouter'

export const appRouter = mergeRouters(
  advertsRouter,
  baseEntityRouter,
  usersRouter,
  publicationsRouter,
  settlementRouter,
  commentRouter,
)

// export type definition of API
export type AppRouter = typeof appRouter
