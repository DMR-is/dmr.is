import { z } from 'zod'

import {
  approveReport,
  assignReport,
  denyReport,
  startReportFines,
} from '../../../../gen/fetch'
import { apiCall } from '../../../api/apiCall'
import { protectedProcedure, router } from '../trpc'

export const reportWorkflowRouter = router({
  assign: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return apiCall(
        assignReport({
          client: ctx.client,
          path: { reportId: input.reportId },
        }),
      )
    }),

  deny: protectedProcedure
    .input(z.object({ reportId: z.string(), denialReason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return apiCall(
        denyReport({
          client: ctx.client,
          path: { reportId: input.reportId },
          body: { denialReason: input.denialReason },
        }),
      )
    }),

  approve: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return apiCall(
        approveReport({
          client: ctx.client,
          path: { reportId: input.reportId },
        }),
      )
    }),

  startFines: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return apiCall(
        startReportFines({
          client: ctx.client,
          path: { reportId: input.reportId },
        }),
      )
    }),
})
