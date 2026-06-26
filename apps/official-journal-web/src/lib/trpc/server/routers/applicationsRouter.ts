import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

export const applicationsRouter = router({
  reopenApplication: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.reopenApplication({ id: input.id })
    }),
})
