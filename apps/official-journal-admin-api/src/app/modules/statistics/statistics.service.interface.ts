import { ResultWrapper } from '@dmr.is/types'

import { GetStatisticsDepartmentResponse } from './dto/statistics-department.dto'
import { StatisticsOverviewQueryType } from './dto/statistics-overview-constants.dto'
import {
  GetStatisticOverviewDashboardResponse,
  GetStatisticsOverviewResponse,
} from './dto/statistics-overview-dto'

export interface IStatisticsService {
  getDepartment(
    slug: string,
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
