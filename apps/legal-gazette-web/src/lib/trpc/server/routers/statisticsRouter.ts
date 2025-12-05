import { protectedProcedure, router } from '../trpc'

export const statisticsRouter = router({
  getAdvertsInProgressStats: protectedProcedure.query(async ({ ctx }) =>
    ctx.api.getAdvertsInProgressStats(),
  ),
  getAdvertsToBePublishedStats: protectedProcedure.query(async ({ ctx }) =>
    ctx.api.getAdvertsToBePublishedStats(),
  ),
  getCountByStatuses: protectedProcedure.query(async ({ ctx }) =>
    ctx.api.getCountByStatuses(),
  ),
})
