import { StatisticsDepartmentQuery } from '../../dto/statistics/statistics-department-query.dto'
import { StatisticsDepartmentResponse } from '../../dto/statistics/statistics-department.dto'
import { StatisticsOverview } from '../../dto/statistics/statistics-overview-dto'
import { StatisticsOverviewQuery } from '../../dto/statistics/statistics-overview-query.dto'

export interface IStatisticsService {
  getDepartment(
    params?: StatisticsDepartmentQuery,
  ): Promise<StatisticsDepartmentResponse>

  getOverview(params?: StatisticsOverviewQuery): Promise<StatisticsOverview>
}

export const IStatisticsService = Symbol('IStatisticsService')
