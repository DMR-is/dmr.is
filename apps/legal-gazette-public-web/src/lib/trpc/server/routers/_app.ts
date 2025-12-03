import { mergeRouters } from '../trpc'
import { baseEntityRouter } from './baseEntityRouter'
import { legacyMigrationRouter } from './legacyMigrationRouter'
import { publicationRouter } from './publicationRouter'
import { subscriberRouter } from './subscriberRouter'

export const appRouter = mergeRouters(
  publicationRouter,
  subscriberRouter,
  baseEntityRouter,
  legacyMigrationRouter,
)

// export type definition of API
export type AppRouter = typeof appRouter
