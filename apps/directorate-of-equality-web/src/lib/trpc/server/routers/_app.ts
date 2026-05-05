import { router } from '../trpc'
import { adminReportRouter } from './adminReportRouter'
import { companyRouter } from './companyRouter'
import { configRouter } from './configRouter'
import { reportCommentsRouter } from './reportCommentsRouter'
import { reportsRouter } from './reportsRouter'
import { reportWorkflowRouter } from './reportWorkflowRouter'
import { userRouter } from './userRouter'

export const appRouter = router({
  adminReport: adminReportRouter,
  company: companyRouter,
  user: userRouter,
  config: configRouter,
  reports: reportsRouter,
  reportComments: reportCommentsRouter,
  reportWorkflow: reportWorkflowRouter,
})

export type AppRouter = typeof appRouter
