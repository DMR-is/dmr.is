import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

export const attachmentsRouter = router({
  createAttachment: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        createAdvertAppendixBody: z.object({
          title: z.string(),
          content: z.string(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.createAdvertAppendix(input)
    }),

  deleteAttachment: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        additionId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.deleteAdvertAppendix({
        id: input.id,
        deleteAdvertAppendixBody: {
          additionId: input.additionId,
        },
      })
    }),

  updateAppendix: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        updateAdvertAppendixBody: z.object({
          content: z.string().nullable(),
          title: z.string().nullable(),
          additionId: z.string(),
          order: z.string().nullable(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.updateAdvertAppendix(input)
    }),
})
