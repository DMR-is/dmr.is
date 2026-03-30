import { z } from 'zod'

import {
  DepartmentSlugEnum,
  SearchAnalyticsInterval,
  SearchAnalyticsQueryTableType,
  StatisticsOverviewQueryType,
} from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

export const statisticsRouter = router({
  getStatisticsForDepartment: protectedProcedure
    .input(
      z.object({
        slug: z.nativeEnum(DepartmentSlugEnum),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getStatisticsForDepartment({ slug: input.slug })
    }),

  getStatisticsOverview: protectedProcedure
    .input(
      z.object({
        type: z.nativeEnum(StatisticsOverviewQueryType),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getStatisticsOverview({ type: input.type })
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
        interval: z.nativeEnum(SearchAnalyticsInterval).optional(),
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
        type: z.nativeEnum(SearchAnalyticsQueryTableType),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getSearchAnalyticsQueries(input)
    }),
})
