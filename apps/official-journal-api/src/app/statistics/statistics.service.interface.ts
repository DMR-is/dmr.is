import { StatisticsDepartmentResponse } from '../../dto/statistics/statistics-department.dto'
import { StatisticsOverviewResponse } from '../../dto/statistics/statistics-overview-dto'

export interface IStatisticsService {
  getDepartment(type: string): Promise<StatisticsDepartmentResponse>

  getOverview(id: string): Promise<StatisticsOverviewResponse>
}

export const IStatisticsService = Symbol('IStatisticsService')
