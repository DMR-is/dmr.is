import {
  zApproveReportPath,
  zAssignReportPath,
  zDenyReportBody,
  zDenyReportPath,
  zStartReportFinesPath,
} from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'

export const reportWorkflowRouter = router({
  assign: protectedProcedure
    .input(zAssignReportPath)
    .mutation(async ({ ctx, input }) => {
      await ctx.api.assignReport({
        path: { reportId: input.reportId },
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

  startFines: protectedProcedure
    .input(zStartReportFinesPath)
    .mutation(async ({ ctx, input }) => {
      await ctx.api.startReportFines({
        path: { reportId: input.reportId },
      })
    }),
})
