import { protectedProcedure, router } from '../trpc'

export const paymentsRouter = router({
  getPayments: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.api.getPaymentsList({})
  }),
})
