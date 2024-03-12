import { Inject, Injectable } from '@nestjs/common'
import { IStatisticsService } from './statistics.service.interface'
import { StatisticsDepartmentQuery } from '../../dto/statistics/statistics-department-query.dto'
import { StatisticsDepartmentResponse } from '../../dto/statistics/statistics-department.dto'
import { LOGGER_PROVIDER, Logger } from '@dmr.is/logging'
import { StatisticsOverviewResponse } from '../../dto/statistics/statistics-overview-dto'
import { StatisticsOverviewQuery } from '../../dto/statistics/statistics-overview-query.dto'

@Injectable()
export class StatisticsService implements IStatisticsService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('StatisticsService')
  }
  getDepartment(
    params?: StatisticsDepartmentQuery | undefined,
  ): Promise<StatisticsDepartmentResponse> {
    this.logger.info('getDepartment', { params })
    throw new Error('Method not implemented.')
  }

  getOverview(
    params?: StatisticsOverviewQuery | undefined,
  ): Promise<StatisticsOverviewResponse> {
    this.logger.info('getOverview', { params })
    throw new Error('Method not implemented.')
  }
}
