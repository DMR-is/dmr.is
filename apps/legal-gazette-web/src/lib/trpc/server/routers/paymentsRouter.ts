import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

const pagingInput = z.object({
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(10),
})

export const paymentsRouter = router({
  getPayments: protectedProcedure
    .input(pagingInput)
    .query(async ({ ctx, input }) => {
      return await ctx.api.getPaymentsList({
        page: input.page,
        pageSize: input.pageSize,
      })
    }),
})
