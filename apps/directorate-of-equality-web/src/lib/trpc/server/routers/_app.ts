import { router } from '../trpc'
import { adminReportRouter } from './adminReportRouter'
import { companyRouter } from './companyRouter'
import { configRouter } from './configRouter'
import { locationRouter } from './locationRouter'
import { reportCommentsRouter } from './reportCommentsRouter'
import { reportsRouter } from './reportsRouter'
import { reportStatisticsRouter } from './reportStatisticsRouter'
import { reportWorkflowRouter } from './reportWorkflowRouter'
import { userRouter } from './userRouter'

export const appRouter = router({
  adminReport: adminReportRouter,
  company: companyRouter,
  user: userRouter,
  config: configRouter,
  location: locationRouter,
  reports: reportsRouter,
  reportComments: reportCommentsRouter,
  reportStatistics: reportStatisticsRouter,
  reportWorkflow: reportWorkflowRouter,
})

export type AppRouter = typeof appRouter
