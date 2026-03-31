import { z } from 'zod'

import {
  getEmptySearchAnalyticsBreakdowns,
  getEmptySearchAnalyticsOverview,
  getEmptySearchAnalyticsQueries,
  getEmptySearchAnalyticsTrends,
  getSearchAnalyticsBreakdownsMock,
  getSearchAnalyticsOverviewMock,
  getSearchAnalyticsQueriesMock,
  getSearchAnalyticsTrendsMock,
} from '../../../search-analytics/mock-data'
import {
  SearchAnalyticsInterval,
  SearchAnalyticsQueryTableType,
} from '../../../search-analytics/types'
import { protectedProcedure, router } from '../trpc'

const useSearchAnalyticsMocks = process.env.NODE_ENV !== 'production'

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
  getSearchAnalyticsOverview: protectedProcedure
    .input(
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      return useSearchAnalyticsMocks
        ? getSearchAnalyticsOverviewMock(input)
        : getEmptySearchAnalyticsOverview()
    }),
  getSearchAnalyticsTrends: protectedProcedure
    .input(
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        interval: z.nativeEnum(SearchAnalyticsInterval).optional(),
      }),
    )
    .query(async ({ input }) => {
      return useSearchAnalyticsMocks
        ? getSearchAnalyticsTrendsMock(input)
        : getEmptySearchAnalyticsTrends()
    }),
  getSearchAnalyticsBreakdowns: protectedProcedure
    .input(
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      return useSearchAnalyticsMocks
        ? getSearchAnalyticsBreakdownsMock(input)
        : getEmptySearchAnalyticsBreakdowns()
    }),
  getSearchAnalyticsQueries: protectedProcedure
    .input(
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        type: z.nativeEnum(SearchAnalyticsQueryTableType),
      }),
    )
    .query(async ({ input }) => {
      return useSearchAnalyticsMocks
        ? getSearchAnalyticsQueriesMock(input)
        : getEmptySearchAnalyticsQueries(input.type)
    }),
})
