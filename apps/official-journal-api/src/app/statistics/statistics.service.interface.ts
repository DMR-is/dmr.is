import { StatisticsDepartmentQuery } from '../../dto/statistics/statistics-department-query.dto'
import { StatisticsDepartmentResponse } from '../../dto/statistics/statistics-department.dto'

export interface IStatisticsService {
  getDepartment(
    params?: StatisticsDepartmentQuery,
  ): Promise<StatisticsDepartmentResponse>
}

export const IStatisticsService = Symbol('IStatisticsService')
