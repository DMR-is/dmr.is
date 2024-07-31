import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  GetStatisticsDepartmentResponse,
  GetStatisticsOverviewResponse,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Controller, Get, Inject, Query } from '@nestjs/common'
import { ApiQuery, ApiResponse } from '@nestjs/swagger'

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

  @Get('department')
  @ApiQuery({ name: 'slug', type: String, required: true })
  @ApiResponse({
    status: 200,
    type: GetStatisticsDepartmentResponse,
    description: 'Gets statistics for individual department (a, b or c)',
  })
  async department(
    @Query('slug') slug: string,
  ): Promise<GetStatisticsDepartmentResponse> {
    return ResultWrapper.unwrap(
      await this.statisticsService.getDepartment(slug),
    )
  }

  @Get('overview')
  @ApiQuery({ name: 'type', type: String, required: true })
  @ApiQuery({ name: 'userId', type: String, required: false })
  @ApiResponse({
    status: 200,
    type: GetStatisticsOverviewResponse,
    description: 'Gets overview of statistics',
  })
  async overview(
    @Query('type') type: string,
    @Query('userId') userId?: string,
  ): Promise<GetStatisticsOverviewResponse> {
    return ResultWrapper.unwrap(
      await this.statisticsService.getOverview(type, userId),
    )
  }
}
