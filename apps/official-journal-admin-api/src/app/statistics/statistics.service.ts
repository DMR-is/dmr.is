import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  GetStatisticsDepartmentResponse,
  GetStatisticsOverviewResponse,
} from '@dmr.is/shared/dto'

import { Inject, Injectable } from '@nestjs/common'

import { IStatisticsService } from './statistics.service.interface'

@Injectable()
export class StatisticsService implements IStatisticsService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('StatisticsService')
  }
  getDepartment(
    id?: string | undefined,
  ): Promise<GetStatisticsDepartmentResponse> {
    this.logger.info('getDepartment', id)
    throw new Error('Method not implemented.')
  }

  getOverview(
    type?: string | undefined,
  ): Promise<GetStatisticsOverviewResponse> {
    this.logger.info('getOverview', type)
    throw new Error('Method not implemented.')
  }
}
