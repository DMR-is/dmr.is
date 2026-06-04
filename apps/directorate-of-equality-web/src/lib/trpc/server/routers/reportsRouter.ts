import {
  zGetReportByIdPath,
  zGetReportOutliersPath,
  zGetReportOutliersQuery,
  zListReportsQuery,
} from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'

export const reportsRouter = router({
  list: protectedProcedure
    .input(zListReportsQuery.optional())
    .query(({ ctx, input }) => {
      const query = input ? input : undefined

      return ctx.api.listReports({ query })
    }),

  getById: protectedProcedure
    .input(zGetReportByIdPath)
    .query(({ ctx, input }) =>
      ctx.api.getReportById({
        path: { id: input.id },
      }),
    ),

  getOutliers: protectedProcedure
    .input(zGetReportOutliersPath.merge(zGetReportOutliersQuery))
    .query(({ ctx, input }) => {
      const { id, page, pageSize, sortBy, direction } = input
      return ctx.api.getReportOutliers({
        path: { id },
        query: { page, pageSize, sortBy, direction },
      })
    }),

  overview: protectedProcedure.query(({ ctx }) => ctx.api.getReportOverview()),

  overviewStatistics: protectedProcedure.query(({ ctx }) =>
    ctx.api.getReportOverviewStatistics(),
  ),
})
