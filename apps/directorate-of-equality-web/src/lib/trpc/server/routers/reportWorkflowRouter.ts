import {
  zApproveReportPath,
  zAssignReportBody,
  zAssignReportPath,
  zDenyReportBody,
  zDenyReportPath,
} from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'

export const reportWorkflowRouter = router({
  assign: protectedProcedure
    .input(zAssignReportPath.extend(zAssignReportBody.shape))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.assignReport({
        path: { reportId: input.reportId },
        body: { userId: input.userId },
      })
    }),

  deny: protectedProcedure
    .input(zDenyReportPath.extend(zDenyReportBody.shape))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.denyReport({
        path: { reportId: input.reportId },
        body: { denialReason: input.denialReason },
      })
    }),

  approve: protectedProcedure
    .input(zApproveReportPath)
    .mutation(async ({ ctx, input }) => {
      await ctx.api.approveReport({
        path: { reportId: input.reportId },
      })
    }),
})
