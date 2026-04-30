import {
  zGetReportByIdPath,
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
})
