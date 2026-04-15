import * as z from 'zod'

import { protectedProcedure, router } from '../trpc'

const backfillHtmlInput = z.object({
  dryRun: z.boolean().optional(),
})

const backfilledPublicationsInput = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
})

export const htmlAdminRouter = router({
  backfillPublishedHtml: protectedProcedure
    .input(backfillHtmlInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.api.backfillPublishedHtml({ dryRun: input.dryRun })
    }),

  getBackfillStatus: protectedProcedure.query(async ({ ctx }) => {
    return ctx.api.getBackfillStatus()
  }),

  getBackfilledPublications: protectedProcedure
    .input(backfilledPublicationsInput)
    .query(async ({ ctx, input }) => {
      return ctx.api.getBackfilledPublications(input)
    }),

  startBackfillRevert: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.api.startBackfillRevert()
  }),

  getRevertStatus: protectedProcedure.query(async ({ ctx }) => {
    return ctx.api.getRevertStatus()
  }),
})
