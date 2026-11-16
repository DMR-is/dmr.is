import { router } from '../trpc'
import { adminReportRouter } from './adminReportRouter'
import { apiKeyRouter } from './apiKeyRouter'
import { companyEmailRouter } from './companyEmailRouter'
import { companyRouter } from './companyRouter'
import { configRouter } from './configRouter'
import { locationRouter } from './locationRouter'
import { noticeIssuesRouter } from './noticeIssuesRouter'
import { partnerClientRouter } from './partnerClientRouter'
import { reportCommentsRouter } from './reportCommentsRouter'
import { reportsRouter } from './reportsRouter'
import { reportStatisticsRouter } from './reportStatisticsRouter'
import { reportWorkflowRouter } from './reportWorkflowRouter'
import { userRouter } from './userRouter'
import { withholdingTaxRouter } from './withholdingTaxRouter'

export const appRouter = router({
  adminReport: adminReportRouter,
  apiKey: apiKeyRouter,
  company: companyRouter,
  companyEmail: companyEmailRouter,
  user: userRouter,
  config: configRouter,
  location: locationRouter,
  noticeIssues: noticeIssuesRouter,
  partnerClient: partnerClientRouter,
  reports: reportsRouter,
  reportComments: reportCommentsRouter,
  reportStatistics: reportStatisticsRouter,
  reportWorkflow: reportWorkflowRouter,
  withholdingTax: withholdingTaxRouter,
})

export type AppRouter = typeof appRouter
