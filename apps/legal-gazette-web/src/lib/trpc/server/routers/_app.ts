import { mergeRouters } from '../trpc'
import { advertsRouter } from './advertsRouter'
import { baseEntityRouter } from './baseEntityRouter'
import { channelsRouter } from './channelsRouter'
import { commentRouter } from './commentRouter'
import { nationalRegistryRouter } from './nationalRegistryRouter'
import { paymentsRouter } from './paymentsRouter'
import { publicationsRouter } from './publicationsRouter'
import { settlementRouter } from './settlementRouter'
import { signatureRouter } from './signatureRouter'
import { statisticsRouter } from './statisticsRouter'
import { tbrSettingsRouter } from './tbrSettingsRouter'
import { usersRouter } from './usersRouter'

export const appRouter = mergeRouters(
  advertsRouter,
  baseEntityRouter,
  usersRouter,
  publicationsRouter,
  settlementRouter,
  commentRouter,
  channelsRouter,
  statisticsRouter,
  signatureRouter,
  tbrSettingsRouter,
  nationalRegistryRouter,
  paymentsRouter,
)

// export type definition of API
export type AppRouter = typeof appRouter
