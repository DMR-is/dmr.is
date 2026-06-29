import {
  zCreateReportCommentBody,
  zCreateReportCommentPath,
  zDeleteReportCommentPath,
} from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'

export const reportCommentsRouter = router({
  create: protectedProcedure
    .input(zCreateReportCommentPath.extend(zCreateReportCommentBody.shape))
    .mutation(({ ctx, input }) =>
      ctx.api.createReportComment({
        path: { reportId: input.reportId },
        body: {
          visibility: input.visibility,
          body: input.body,
        },
      }),
    ),

  delete: protectedProcedure
    .input(zDeleteReportCommentPath)
    .mutation(async ({ ctx, input }) => {
      await ctx.api.deleteReportComment({
        path: { reportId: input.reportId, commentId: input.commentId },
      })
    }),
})
