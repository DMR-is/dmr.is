import { UserRoleEnum } from '@dmr.is/constants'
import { CurrentUser, Roles } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { RoleGuard, TokenJwtAuthGuard } from '@dmr.is/official-journal/guards'
import { UserDto } from '@dmr.is/official-journal/modules/user'
import { EnumValidationPipe } from '@dmr.is/pipelines'
import { ResultWrapper } from '@dmr.is/types'

import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger'

import { GetStatisticsDepartmentResponse } from './dto/statistics-department.dto'
import { StatisticsOverviewQueryType } from './dto/statistics-overview-constants.dto'
import {
  GetStatisticOverviewDashboardResponse,
  GetStatisticsOverviewResponse,
} from './dto/statistics-overview-dto'
import { IStatisticsService } from './statistics.service.interface'

@ApiBearerAuth()
@Controller({
  version: '1',
})
@UseGuards(TokenJwtAuthGuard, RoleGuard)
@Roles(UserRoleEnum.Admin)
export class StatisticsController {
  constructor(
    @Inject(IStatisticsService)
    private readonly statisticsService: IStatisticsService,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  @Get('/department/:slug')
  @ApiOperation({ operationId: 'getStatisticsForDepartment' })
  @ApiParam({ name: 'slug' })
  @ApiResponse({ status: 200, type: GetStatisticsDepartmentResponse })
  async department(
    @Param('slug') slug: string,
  ): Promise<GetStatisticsDepartmentResponse> {
    return ResultWrapper.unwrap(
      await this.statisticsService.getDepartment(slug),
    )
  }

  @Get('/overview/dashboard')
  @ApiOperation({ operationId: 'getStatisticsOverviewDashboard' })
  @ApiResponse({ status: 200, type: GetStatisticOverviewDashboardResponse })
  async dashboardOverview(@CurrentUser() user: UserDto) {
    return ResultWrapper.unwrap(
      await this.statisticsService.getOverviewForDashboard(user.id),
    )
  }

  @Get('/overview/:type')
  @ApiOperation({ operationId: 'getStatisticsOverview' })
  @ApiParam({
    name: 'type',
    enum: StatisticsOverviewQueryType,
    enumName: 'StatisticsOverviewQueryType',
  })
  @ApiResponse({ status: 200, type: GetStatisticsOverviewResponse })
  async overview(
    @Param('type', new EnumValidationPipe(StatisticsOverviewQueryType))
    type: StatisticsOverviewQueryType,
    @CurrentUser() user: UserDto,
  ): Promise<GetStatisticsOverviewResponse> {
    return ResultWrapper.unwrap(
      await this.statisticsService.getOverview(type, user?.id),
    )
  }
}
