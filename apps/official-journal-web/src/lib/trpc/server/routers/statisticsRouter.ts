import { z } from 'zod'

import {
  DepartmentSlugEnum,
  StatisticsOverviewQueryType,
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

  getStatisticsOverview: protectedProcedure
    .input(
      z.object({
        type: z.enum(StatisticsOverviewQueryType),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getStatisticsOverview({ type: input.type })
    }),

  getStatisticsOverviewDashboard: protectedProcedure.query(
    async ({ ctx }) => {
      return ctx.api.getStatisticsOverviewDashboard()
    },
  ),
})
