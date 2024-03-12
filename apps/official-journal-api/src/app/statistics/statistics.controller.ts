import { LOGGER_PROVIDER, Logger } from '@dmr.is/logging'
import { Controller, Get, Inject, Query } from '@nestjs/common'
import { IStatisticsService } from './statistics.service.interface'
import { StatisticsDepartmentQuery } from '../../dto/statistics/statistics-department-query.dto'
import { ApiQuery, ApiResponse } from '@nestjs/swagger'
import { StatisticsDepartmentResponse } from '../../dto/statistics/statistics-department.dto'
import { StatisticsOverviewQuery } from '../../dto/statistics/statistics-overview-query.dto'
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
  @ApiQuery({ name: 'params', type: StatisticsDepartmentQuery })
  @ApiResponse({
    status: 200,
    type: StatisticsDepartmentResponse,
    description: 'Gets statistics for individual department (a, b or c)',
  })
  department(@Query() params?: StatisticsDepartmentQuery) {
    return this.statisticsService.getDepartment(params)
  }

  @Get('overview')
  @ApiQuery({ name: 'params', type: StatisticsOverviewQuery })
  @ApiResponse({
    status: 200,
    type: StatisticsOverviewResponse,
    description: 'Gets statistics for all departments',
  })
  overview(@Query() params?: StatisticsOverviewQuery) {
    return this.statisticsService.getOverview(params)
  }
}
