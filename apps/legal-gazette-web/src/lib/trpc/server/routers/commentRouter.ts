import z from 'zod'

import { protectedProcedure, router } from '../trpc'

const getCommentsSchema = z.object({ advertId: z.uuid() })

const postCommentSchema = z.object({
  advertId: z.uuid(),
  comment: z.string().min(1).max(1000),
})

export const commentRouter = router({
  getComments: protectedProcedure
    .input(getCommentsSchema)
    .query(
      async ({ ctx, input }) => await ctx.api.getCommentsByAdvertId(input),
    ),
  postComment: protectedProcedure
    .input(postCommentSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.postComment({
        advertId: input.advertId,
        createTextCommentBodyDto: { comment: input.comment },
      })
    }),
})
