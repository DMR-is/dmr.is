import { z } from 'zod'

import {
  DepartmentSlugEnum,
  StatisticsOverviewQueryType,
} from '../../../../gen/fetch'
import {
  type SearchAnalyticsBreakdownsResponse,
  SearchAnalyticsInterval,
  type SearchAnalyticsOverviewResponse,
  type SearchAnalyticsQueriesResponse,
  SearchAnalyticsQueryTableType,
  type SearchAnalyticsTrendsResponse,
} from '../../../search-analytics/types'
import { protectedProcedure, router } from '../trpc'

const getAdminApiBaseUrl = () => {
  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:4000'
  }

  return process.env.DMR_ADMIN_API_BASE_PATH as string
}

const buildUrl = (
  path: string,
  query?: Record<string, string | undefined>,
): string => {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) {
      params.set(key, value)
    }
  }

  const search = params.toString()
  return `${getAdminApiBaseUrl()}/api/v1/statistics${path}${search ? `?${search}` : ''}`
}

const fetchStatisticsJson = async <T>(
  path: string,
  idToken: string,
  query?: Record<string, string | undefined>,
): Promise<T> => {
  const response = await fetch(buildUrl(path, query), {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Statistics request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

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
      return fetchStatisticsJson<SearchAnalyticsOverviewResponse>(
        '/search/overview',
        ctx.idToken,
        input,
      )
    }),

  getSearchAnalyticsTrends: protectedProcedure
    .input(
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        interval: z
          .enum(Object.values(SearchAnalyticsInterval) as [string, ...string[]])
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return fetchStatisticsJson<SearchAnalyticsTrendsResponse>(
        '/search/trends',
        ctx.idToken,
        input,
      )
    }),

  getSearchAnalyticsBreakdowns: protectedProcedure
    .input(
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return fetchStatisticsJson<SearchAnalyticsBreakdownsResponse>(
        '/search/breakdowns',
        ctx.idToken,
        input,
      )
    }),

  getSearchAnalyticsQueries: protectedProcedure
    .input(
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        type: z.enum(
          Object.values(SearchAnalyticsQueryTableType) as [string, ...string[]],
        ),
      }),
    )
    .query(async ({ ctx, input }) => {
      return fetchStatisticsJson<SearchAnalyticsQueriesResponse>(
        '/search/queries',
        ctx.idToken,
        input,
      )
    }),
})
