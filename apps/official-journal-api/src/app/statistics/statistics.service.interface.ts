import { StatisticsDepartmentResponse } from '../../dto/statistics/statistics-department.dto'
import { StatisticsOverviewResponse } from '../../dto/statistics/statistics-overview-dto'

export interface IStatisticsService {
  getDepartment(params?: string): Promise<StatisticsDepartmentResponse>

  getOverview(id?: string): Promise<StatisticsOverviewResponse>
}

export const IStatisticsService = Symbol('IStatisticsService')
