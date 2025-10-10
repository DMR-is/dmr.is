import z from 'zod'

import { protectedProcedure, router } from '../trpc'

export const advertRouter = router({
  getAdvert: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.advertsApi.getAdvertById({ id: input.id })
    }),
})
