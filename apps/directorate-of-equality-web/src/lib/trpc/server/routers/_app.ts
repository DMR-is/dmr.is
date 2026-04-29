import { router } from '../trpc'
import { configRouter } from './configRouter'
import { reportCommentsRouter } from './reportCommentsRouter'
import { reportWorkflowRouter } from './reportWorkflowRouter'
import { reportsRouter } from './reportsRouter'
import { userRouter } from './userRouter'

export const appRouter = router({
  user: userRouter,
  config: configRouter,
  reports: reportsRouter,
  reportComments: reportCommentsRouter,
  reportWorkflow: reportWorkflowRouter,
})

export type AppRouter = typeof appRouter
