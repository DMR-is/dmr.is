import { z } from 'zod'

import {
  DepartmentSlugEnum,
  SearchAnalyticsInterval,
  SearchAnalyticsQueryTableType,
} from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

export const statisticsRouter = router({
  getStatisticsForDepartment: protectedProcedure
    .input(
      z.object({
        slug: z.enum(DepartmentSlugEnum),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getStatisticsForDepartment({ slug: input.slug })
    }),

  getStatisticsOverviewDashboard: protectedProcedure.query(async ({ ctx }) => {
    return ctx.api.getStatisticsOverviewDashboard()
  }),

  getSearchAnalyticsOverview: protectedProcedure
    .input(
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getSearchAnalyticsOverview(input)
    }),

  getSearchAnalyticsTrends: protectedProcedure
    .input(
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        interval: z.enum(SearchAnalyticsInterval).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getSearchAnalyticsTrends(input)
    }),

  getSearchAnalyticsBreakdowns: protectedProcedure
    .input(
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getSearchAnalyticsBreakdowns(input)
    }),

  getSearchAnalyticsQueries: protectedProcedure
    .input(
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        type: z.enum(SearchAnalyticsQueryTableType),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getSearchAnalyticsQueries(input)
    }),
})
