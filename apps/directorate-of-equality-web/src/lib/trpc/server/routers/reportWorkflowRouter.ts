import {
  zApproveReportPath,
  zAssignReportBody,
  zAssignReportPath,
  zCloseReportCommunicationPath,
  zDenyReportBody,
  zDenyReportPath,
  zOpenReportCommunicationPath,
  zSendReportToEditBody,
  zSendReportToEditPath,
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

  sendToEdit: protectedProcedure
    .input(zSendReportToEditPath.extend(zSendReportToEditBody.shape))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.sendReportToEdit({
        path: { reportId: input.reportId },
        body: { reason: input.reason },
      })
    }),

  openCommunication: protectedProcedure
    .input(zOpenReportCommunicationPath)
    .mutation(async ({ ctx, input }) => {
      await ctx.api.openReportCommunication({
        path: { reportId: input.reportId },
      })
    }),

  closeCommunication: protectedProcedure
    .input(zCloseReportCommunicationPath)
    .mutation(async ({ ctx, input }) => {
      await ctx.api.closeReportCommunication({
        path: { reportId: input.reportId },
      })
    }),
})
