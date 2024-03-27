import {
  GetStatisticsDepartmentResponse,
  GetStatisticsOverviewResponse,
} from '@dmr.is/shared/dto'

export interface IStatisticsService {
  getDepartment(type: string): Promise<GetStatisticsDepartmentResponse>

  getOverview(id: string): Promise<GetStatisticsOverviewResponse>
}

export const IStatisticsService = Symbol('IStatisticsService')
