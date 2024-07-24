import {
  GetStatisticsDepartmentResponse,
  GetStatisticsOverviewResponse,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface IStatisticsService {
  getDepartment(
    slug: string,
  ): Promise<ResultWrapper<GetStatisticsDepartmentResponse>>

  getOverview(
    id: string,
    userId?: string,
  ): Promise<ResultWrapper<GetStatisticsOverviewResponse>>
}

export const IStatisticsService = Symbol('IStatisticsService')
