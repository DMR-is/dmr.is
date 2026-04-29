import { router } from '../trpc'
import { configRouter } from './configRouter'
import { reportCommentsRouter } from './reportCommentsRouter'
import { reportCreateRouter } from './reportCreateRouter'
import { reportResultRouter } from './reportResultRouter'
import { reportStatisticsRouter } from './reportStatisticsRouter'
import { reportWorkflowRouter } from './reportWorkflowRouter'
import { reportsRouter } from './reportsRouter'
import { userRouter } from './userRouter'

export const appRouter = router({
  user: userRouter,
  config: configRouter,
  reports: reportsRouter,
  reportCreate: reportCreateRouter,
  reportComments: reportCommentsRouter,
  reportWorkflow: reportWorkflowRouter,
  reportResult: reportResultRouter,
  reportStatistics: reportStatisticsRouter,
})

export type AppRouter = typeof appRouter
