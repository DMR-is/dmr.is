import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger'

import { UserRoleEnum } from '@dmr.is/constants'
import { CurrentUser, Roles } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { RoleGuard } from '@dmr.is/ojoi/modules/guards/auth'
import { EnumValidationPipe } from '@dmr.is/pipelines'
import {
  DepartmentSlugEnum,
  GetStatisticOverviewDashboardResponse,
  GetStatisticsDepartmentResponse,
  GetStatisticsOverviewResponse,
  StatisticsOverviewQueryType,
  UserDto,
} from '@dmr.is/shared/dto'
import { TokenJwtAuthGuard } from '@dmr.is/shared/modules'
import { ResultWrapper } from '@dmr.is/types'

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
  @ApiParam({
    name: 'slug',
    enum: DepartmentSlugEnum,
    enumName: 'DepartmentSlugEnum',
  })
  @ApiResponse({ status: 200, type: GetStatisticsDepartmentResponse })
  async department(
    @Param('slug', new EnumValidationPipe(DepartmentSlugEnum))
    slug: DepartmentSlugEnum,
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
