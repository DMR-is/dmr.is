import { Inject, Injectable } from '@nestjs/common'
import { IStatisticsService } from './statistics.service.interface'
import { StatisticsDepartmentResponse } from '../../dto/statistics/statistics-department.dto'
import { LOGGER_PROVIDER, Logger } from '@dmr.is/logging'
import { StatisticsOverviewResponse } from '../../dto/statistics/statistics-overview-dto'

@Injectable()
export class StatisticsService implements IStatisticsService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('StatisticsService')
  }
  getDepartment(
    id?: string | undefined,
  ): Promise<StatisticsDepartmentResponse> {
    this.logger.info('getDepartment', id)
    throw new Error('Method not implemented.')
  }

  getOverview(type?: string | undefined): Promise<StatisticsOverviewResponse> {
    this.logger.info('getOverview', type)
    throw new Error('Method not implemented.')
  }
}
