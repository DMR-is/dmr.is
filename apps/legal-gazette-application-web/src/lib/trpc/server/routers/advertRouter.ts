import z from 'zod'

import { protectedProcedure, router } from '../trpc'

const getAdvertsByCaseIdSchema = z.object({
  caseId: z.uuid(),
})

export const advertRouter = router({
  getAdvertByCaseId: protectedProcedure
    .input(getAdvertsByCaseIdSchema)
    .query(async ({ input, ctx }) => {
      return await ctx.api.getAdvertsByCaseId({
        caseId: input.caseId,
      })
    }),
})
