import {
  DepartmentSlugEnum,
  GetStatisticOverviewDashboardResponse,
  GetStatisticsDepartmentResponse,
  GetStatisticsOverviewResponse,
  StatisticsOverviewQueryType,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface IStatisticsService {
  getDepartment(
    slug: DepartmentSlugEnum,
  ): Promise<ResultWrapper<GetStatisticsDepartmentResponse>>

  getOverview(
    type: StatisticsOverviewQueryType,
    userId?: string,
  ): Promise<ResultWrapper<GetStatisticsOverviewResponse>>

  getOverviewForDashboard(
    userId?: string,
  ): Promise<ResultWrapper<GetStatisticOverviewDashboardResponse>>
}

export const IStatisticsService = Symbol('IStatisticsService')
