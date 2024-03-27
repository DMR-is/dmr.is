import { LOGGER_PROVIDER, Logger } from '@dmr.is/logging'
import { Controller, Get, Inject, Query } from '@nestjs/common'
import { IStatisticsService } from './statistics.service.interface'
import { ApiQuery, ApiResponse } from '@nestjs/swagger'
import {
  GetStatisticsDepartmentResponse,
  GetStatisticsOverviewResponse,
} from '@dmr.is/shared/dto'

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
  @ApiQuery({ name: 'id', type: String, required: true })
  @ApiResponse({
    status: 200,
    type: GetStatisticsDepartmentResponse,
    description: 'Gets statistics for individual department (a, b or c)',
  })
  async getDepartment(
    @Query('id') id: string,
  ): Promise<GetStatisticsDepartmentResponse> {
    return this.statisticsService.getDepartment(id)
  }

  @Get('overview')
  @ApiQuery({ name: 'type', type: String, required: true })
  @ApiResponse({
    status: 200,
    type: GetStatisticsOverviewResponse,
    description: 'Gets overview of statistics',
  })
  async getOverview(
    @Query('type') type: string,
  ): Promise<GetStatisticsOverviewResponse> {
    return this.statisticsService.getOverview(type)
  }
}
