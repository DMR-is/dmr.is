import { z } from 'zod'

import { CommentVisibilityEnum } from '../../../../gen/fetch'
import {
  createReportComment,
  deleteReportComment,
  getReportComments,
} from '../../../../gen/fetch'
import { apiCall } from '../../../api/apiCall'
import { protectedProcedure, router } from '../trpc'

export const reportCommentsRouter = router({
  list: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .query(async ({ ctx, input }) => {
      return apiCall(
        getReportComments({
          client: ctx.client,
          path: { reportId: input.reportId },
        }),
      )
    }),

  create: protectedProcedure
    .input(
      z.object({
        reportId: z.string(),
        visibility: z.nativeEnum(CommentVisibilityEnum),
        body: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return apiCall(
        createReportComment({
          client: ctx.client,
          path: { reportId: input.reportId },
          body: { visibility: input.visibility, body: input.body },
        }),
      )
    }),

  delete: protectedProcedure
    .input(z.object({ reportId: z.string(), commentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return apiCall(
        deleteReportComment({
          client: ctx.client,
          path: { reportId: input.reportId, commentId: input.commentId },
        }),
      )
    }),
})
