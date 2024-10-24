import { Route } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { EnumValidationPipe, UUIDValidationPipe } from '@dmr.is/pipelines'
import {
  GetStatisticsDepartmentResponse,
  GetStatisticsOverviewResponse,
  StatisticsOverviewQueryType,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Controller, Inject, Query } from '@nestjs/common'

import { IStatisticsService } from './statistics.service.interface'

@Controller({
  version: '1',
})
export class StatisticsController {
  constructor(
    @Inject(IStatisticsService)
    private readonly statisticsService: IStatisticsService,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  @Route({
    path: '/department',
    operationId: 'getStatisticsForDepartment',
    query: [{ name: 'slug', type: 'string', required: true }],
    description: 'Gets statistics for individual department (a, b or c)',
    responseType: GetStatisticsDepartmentResponse,
  })
  async department(
    @Query('slug') slug: string,
  ): Promise<GetStatisticsDepartmentResponse> {
    return ResultWrapper.unwrap(
      await this.statisticsService.getDepartment(slug),
    )
  }

  @Route({
    path: '/overview',
    operationId: 'getStatisticsOverview',
    query: [
      { name: 'type', enum: StatisticsOverviewQueryType, required: true },
      {
        name: 'userId',
        type: String,
        required: false,
        allowEmptyValue: true,
      },
    ],
    description: 'Gets overview of statistics',
    responseType: GetStatisticsOverviewResponse,
  })
  async overview(
    @Query('type', new EnumValidationPipe(StatisticsOverviewQueryType))
    type: StatisticsOverviewQueryType,
    @Query('userId', new UUIDValidationPipe(true)) userId?: string,
  ): Promise<GetStatisticsOverviewResponse> {
    return ResultWrapper.unwrap(
      await this.statisticsService.getOverview(type, userId),
    )
  }
}
