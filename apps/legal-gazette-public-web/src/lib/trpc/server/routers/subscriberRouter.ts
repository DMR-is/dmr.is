import { protectedProcedure, router } from '../trpc'

export const subscriberRouter = router({
  getMySubscriber: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.api.getMySubscriber()
  }),
})
