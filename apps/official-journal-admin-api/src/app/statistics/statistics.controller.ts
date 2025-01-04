import { USER_ROLES } from '@dmr.is/constants'
import { CurrentUser, Roles, Route } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { RoleGuard, TokenJwtAuthGuard } from '@dmr.is/modules'
import { EnumValidationPipe } from '@dmr.is/pipelines'
import {
  AdminUser,
  DepartmentSlugEnum,
  GetStatisticsDepartmentResponse,
  GetStatisticsOverviewResponse,
  StatisticsOverviewQueryType,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Controller, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { IStatisticsService } from './statistics.service.interface'

@ApiBearerAuth()
@Controller({
  version: '1',
})
export class StatisticsController {
  constructor(
    @Inject(IStatisticsService)
    private readonly statisticsService: IStatisticsService,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  @UseGuards(TokenJwtAuthGuard, RoleGuard)
  @Roles(USER_ROLES.Admin)
  @Route({
    path: '/department/:slug',
    params: [{ name: 'slug', type: String }],
    operationId: 'getStatisticsForDepartment',
    description: 'Gets statistics for individual department (a, b or c)',
    responseType: GetStatisticsDepartmentResponse,
  })
  async department(
    @Param('slug', new EnumValidationPipe(DepartmentSlugEnum))
    slug: DepartmentSlugEnum,
  ): Promise<GetStatisticsDepartmentResponse> {
    return ResultWrapper.unwrap(
      await this.statisticsService.getDepartment(slug),
    )
  }

  @Route({
    path: '/overview/:type',
    operationId: 'getStatisticsOverview',
    params: [
      { name: 'type', enum: StatisticsOverviewQueryType, required: true },
    ],
    description: 'Gets overview of statistics',
    responseType: GetStatisticsOverviewResponse,
  })
  async overview(
    @Param('type', new EnumValidationPipe(StatisticsOverviewQueryType))
    type: StatisticsOverviewQueryType,
    @CurrentUser() user: AdminUser,
  ): Promise<GetStatisticsOverviewResponse> {
    console.log('user', user)
    return ResultWrapper.unwrap(await this.statisticsService.getOverview(type))
  }
}
