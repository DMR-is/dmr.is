import * as z from 'zod'

import { protectedProcedure, router } from '../trpc'

const backfillHtmlInput = z.object({
  dryRun: z.boolean().optional(),
})

export const htmlAdminRouter = router({
  backfillPublishedHtml: protectedProcedure
    .input(backfillHtmlInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.api.backfillPublishedHtml({ dryRun: input.dryRun })
    }),
})
