import { Inject, Injectable, NotImplementedException } from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ALL_MOCK_ADVERTS } from '@dmr.is/mocks'
import {
  AdvertStatus,
  CaseStatusEnum,
  GetSearchAnalyticsQueriesQuery,
  GetSearchAnalyticsQuery,
  GetSearchAnalyticsTrendsQuery,
  GetStatisticOverviewDashboardResponse,
  GetStatisticsDepartmentResponse,
  SearchAnalyticsBreakdownsResponse,
  SearchAnalyticsOverviewResponse,
  SearchAnalyticsQueriesResponse,
  SearchAnalyticsQueryTableType,
  SearchAnalyticsTrendsResponse,
} from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

import { IStatisticsService } from './statistics.service.interface'

@Injectable()
export class MockStatisticsService implements IStatisticsService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using StatisticsServiceMock')
  }
  getDepartment(
    id: string,
  ): Promise<ResultWrapper<GetStatisticsDepartmentResponse>> {
    const statuses = [
      AdvertStatus.Submitted,
      AdvertStatus.InProgress,
      AdvertStatus.Active,
      AdvertStatus.ReadyForPublication,
    ]

    const adverts = ALL_MOCK_ADVERTS.filter(
      (advert) =>
        advert?.department?.id === id &&
        advert.status &&
        statuses.includes(advert.status),
    )

    let submitted = 0
    let inProgress = 0
    let inReview = 0
    let ready = 0

    adverts.forEach((advert) => {
      switch (advert.status) {
        case AdvertStatus.Submitted:
          submitted++
          break
        case AdvertStatus.InProgress:
          inProgress++
          break
        case AdvertStatus.Active:
          inReview++
          break
        case AdvertStatus.ReadyForPublication:
          ready++
          break
      }
    })

    const total = submitted + inProgress + inReview + ready
    const submittedPercentage = total ? (submitted / total) * 100 : 0
    const inProgressPercentage = total ? (inProgress / total) * 100 : 0
    const inReviewPercentage = total ? (inReview / total) * 100 : 0
    const readyPercentage = total ? (ready / total) * 100 : 0

    // @ts-expect-error FIXME: weird error
    return ResultWrapper.ok({
      submitted: {
        name: CaseStatusEnum.Submitted,
        count: submitted,
        percentage: Math.round(submittedPercentage),
      },
      inProgress: {
        name: CaseStatusEnum.InProgress,
        count: inProgress,
        percentage: Math.round(inProgressPercentage),
      },
      inReview: {
        name: CaseStatusEnum.InReview,
        count: inReview,
        percentage: Math.round(inReviewPercentage),
      },
      ready: {
        name: CaseStatusEnum.ReadyForPublishing,
        count: ready,
        percentage: Math.round(readyPercentage),
      },
      total: total,
    })
  }

  async getOverviewForDashboard(
    _userId: string,
  ): Promise<ResultWrapper<GetStatisticOverviewDashboardResponse>> {
    throw new NotImplementedException()
  }

  async getSearchAnalyticsOverview(
    _query?: GetSearchAnalyticsQuery,
  ): Promise<ResultWrapper<SearchAnalyticsOverviewResponse>> {
    return ResultWrapper.ok({
      totalSearches: 0,
      zeroResultRate: 0,
      withFiltersRate: 0,
      avgDurationMs: 0,
      p95DurationMs: 0,
      pageOneRate: 0,
    })
  }

  async getSearchAnalyticsTrends(
    _query?: GetSearchAnalyticsTrendsQuery,
  ): Promise<ResultWrapper<SearchAnalyticsTrendsResponse>> {
    return ResultWrapper.ok({ points: [] })
  }

  async getSearchAnalyticsBreakdowns(
    _query?: GetSearchAnalyticsQuery,
  ): Promise<ResultWrapper<SearchAnalyticsBreakdownsResponse>> {
    return ResultWrapper.ok({
      queryKinds: [],
      resultBuckets: [],
      sortUsage: [],
      filterUsage: [],
    })
  }

  async getSearchAnalyticsQueries(
    query: GetSearchAnalyticsQueriesQuery,
  ): Promise<ResultWrapper<SearchAnalyticsQueriesResponse>> {
    return ResultWrapper.ok({
      type: query.type ?? SearchAnalyticsQueryTableType.Top,
      rows: [],
    })
  }
}
