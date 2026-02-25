import { mergeRouters } from '../trpc'
import { attachmentsRouter } from './attachmentsRouter'
import { casesRouter } from './casesRouter'
import { categoriesRouter } from './categoriesRouter'
import { commentsRouter } from './commentsRouter'
import { communicationsRouter } from './communicationsRouter'
import { institutionsRouter } from './institutionsRouter'
import { issuesRouter } from './issuesRouter'
import { mainCategoriesRouter } from './mainCategoriesRouter'
import { publishRouter } from './publishRouter'
import { signaturesRouter } from './signaturesRouter'
import { statisticsRouter } from './statisticsRouter'
import { typesRouter } from './typesRouter'
import { usersRouter } from './usersRouter'

export const appRouter = mergeRouters(
  casesRouter,
  commentsRouter,
  publishRouter,
  categoriesRouter,
  mainCategoriesRouter,
  typesRouter,
  signaturesRouter,
  institutionsRouter,
  statisticsRouter,
  usersRouter,
  communicationsRouter,
  attachmentsRouter,
  issuesRouter,
)

export type AppRouter = typeof appRouter
