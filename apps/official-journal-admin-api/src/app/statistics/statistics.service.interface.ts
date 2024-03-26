import {
  StatisticsDepartmentResponse,
  StatisticsOverviewResponse,
} from '@dmr.is/shared/dto/cases'

export interface IStatisticsService {
  getDepartment(type: string): Promise<StatisticsDepartmentResponse>

  getOverview(id: string): Promise<StatisticsOverviewResponse>
}

export const IStatisticsService = Symbol('IStatisticsService')
