import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

export const commentsRouter = router({
  createExternalComment: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        comment: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.api.createExternalComment({
        id: input.id,
        externalCommentBodyDto: {
          comment: input.comment,
        },
      })
    }),

  createInternalComment: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        comment: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.api.createInternalComment({
        id: input.id,
        internalCommentBodyDto: {
          comment: input.comment,
        },
      })
    }),

  deleteComment: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        commentId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.deleteComment({
        id: input.id,
        commentId: input.commentId,
      })
    }),
})
