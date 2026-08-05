import {
  zGetReportByIdPath,
  zGetReportOutlierGroupsPath,
  zGetReportOutliersPath,
  zGetReportOutliersQuery,
  zListReportsForCompanyPath,
  zListReportsForCompanyQuery,
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

  listForCompany: protectedProcedure
    .input(zListReportsForCompanyPath.merge(zListReportsForCompanyQuery))
    .query(({ ctx, input }) => {
      const { companyId, page, pageSize } = input
      return ctx.api.listReportsForCompany({
        path: { companyId },
        query: { page, pageSize },
      })
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
      const { id, page, pageSize, sortBy, direction, groupId } = input
      return ctx.api.getReportOutliers({
        path: { id },
        query: { page, pageSize, sortBy, direction, groupId },
      })
    }),

  getOutlierGroups: protectedProcedure
    .input(zGetReportOutlierGroupsPath)
    .query(({ ctx, input }) =>
      ctx.api.getReportOutlierGroups({
        path: { id: input.id },
      }),
    ),

  overview: protectedProcedure.query(({ ctx }) => ctx.api.getReportOverview()),

  overviewStatistics: protectedProcedure.query(({ ctx }) =>
    ctx.api.getReportOverviewStatistics(),
  ),
})
