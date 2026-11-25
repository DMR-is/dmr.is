import {
  DepartmentSlugEnum,
  GetSearchAnalyticsQueriesQuery,
  GetSearchAnalyticsQuery,
  GetSearchAnalyticsTrendsQuery,
  GetStatisticOverviewDashboardResponse,
  GetStatisticsDepartmentResponse,
  SearchAnalyticsBreakdownsResponse,
  SearchAnalyticsOverviewResponse,
  SearchAnalyticsQueriesResponse,
  SearchAnalyticsTrendsResponse,
} from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

export interface IStatisticsService {
  getDepartment(
    slug: DepartmentSlugEnum,
  ): Promise<ResultWrapper<GetStatisticsDepartmentResponse>>

  getOverviewForDashboard(
    userId?: string,
  ): Promise<ResultWrapper<GetStatisticOverviewDashboardResponse>>

  getSearchAnalyticsOverview(
    query?: GetSearchAnalyticsQuery,
  ): Promise<ResultWrapper<SearchAnalyticsOverviewResponse>>

  getSearchAnalyticsTrends(
    query?: GetSearchAnalyticsTrendsQuery,
  ): Promise<ResultWrapper<SearchAnalyticsTrendsResponse>>

  getSearchAnalyticsBreakdowns(
    query?: GetSearchAnalyticsQuery,
  ): Promise<ResultWrapper<SearchAnalyticsBreakdownsResponse>>

  getSearchAnalyticsQueries(
    query: GetSearchAnalyticsQueriesQuery,
  ): Promise<ResultWrapper<SearchAnalyticsQueriesResponse>>
}

export const IStatisticsService = Symbol('IStatisticsService')
