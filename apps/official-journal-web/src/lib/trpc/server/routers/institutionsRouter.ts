import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

export const institutionsRouter = router({
  getInstitutions: protectedProcedure
    .input(
      z.object({
        page: z.number().optional(),
        pageSize: z.number().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getInstitutions(input)
    }),

  getInstitution: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.api.getInstitution({ id: input.id })
    }),
})
