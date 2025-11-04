import { publicProcedure, router } from '../trpc'

export const statisticsRouter = router({
  getAdvertsInProgressStats: publicProcedure.query(async ({ ctx }) =>
    ctx.statisticsApi.getAdvertsInProgressStats(),
  ),
  getAdvertsToBePublishedStats: publicProcedure.query(async ({ ctx }) =>
    ctx.statisticsApi.getAdvertsToBePublishedStats(),
  ),
  getCountByStatuses: publicProcedure.query(async ({ ctx }) =>
    ctx.statisticsApi.getCountByStatuses(),
  ),
})
