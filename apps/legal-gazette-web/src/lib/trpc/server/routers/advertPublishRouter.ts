import * as z from 'zod'

import { protectedProcedure, router } from '../trpc'

const publishNextInput = z.object({ advertId: z.uuid() })
const publishNextBulkInput = z.object({ advertIds: z.array(z.uuid()) })

export const advertPublishRouter = router({
  publishNext: protectedProcedure
    .input(publishNextInput)
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.publishNext(input)
    }),
  publishNextBulk: protectedProcedure
    .input(publishNextBulkInput)
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.publishNextBulk({
        advertPublishBulkDto: input,
      })
    }),
})
