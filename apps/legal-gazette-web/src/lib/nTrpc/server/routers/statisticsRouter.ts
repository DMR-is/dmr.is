import { protectedProcedure, router } from '../trpc'

export const statisticsRouter = router({
  getAdvertsInProgressStats: protectedProcedure.query(async ({ ctx }) =>
    ctx.statisticsApi.getAdvertsInProgressStats(),
  ),
  getAdvertsToBePublishedStats: protectedProcedure.query(async ({ ctx }) =>
    ctx.statisticsApi.getAdvertsToBePublishedStats(),
  ),
  getCountByStatuses: protectedProcedure.query(async ({ ctx }) =>
    ctx.statisticsApi.getCountByStatuses(),
  ),
})
