import { LOGGER_PROVIDER, Logger } from '@dmr.is/logging'
import { Controller, Get, Inject, Query } from '@nestjs/common'
import { IStatisticsService } from './statistics.service.interface'
import { ApiQuery, ApiResponse } from '@nestjs/swagger'
import { StatisticsDepartmentResponse } from '../../dto/statistics/statistics-department.dto'
import { StatisticsOverviewResponse } from '../../dto/statistics/statistics-overview-dto'

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
    type: StatisticsDepartmentResponse,
    description: 'Gets statistics for individual department (a, b or c)',
  })
  async department(
    @Query('id') id: string,
  ): Promise<StatisticsDepartmentResponse> {
    return this.statisticsService.getDepartment(id)
  }

  @Get('overview')
  @ApiQuery({ name: 'type', type: String, required: true })
  @ApiResponse({
    status: 200,
    type: StatisticsOverviewResponse,
    description: 'Gets overview of statistics',
  })
  async overview(
    @Query('type') type: string,
  ): Promise<StatisticsOverviewResponse> {
    return this.statisticsService.getOverview(type)
  }
}
