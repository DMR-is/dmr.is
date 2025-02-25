import { USER_ROLES } from '@dmr.is/constants'
import { CurrentUser, Roles } from '@dmr.is/decorators'
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

import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger'

import { IStatisticsService } from './statistics.service.interface'

@ApiBearerAuth()
@Controller({
  version: '1',
  //enginn path hér?
})
export class StatisticsController {
  constructor(
    @Inject(IStatisticsService)
    private readonly statisticsService: IStatisticsService,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  @UseGuards(TokenJwtAuthGuard, RoleGuard)
  @Roles(USER_ROLES.Admin)
  @Get('/department/:slug')
  @ApiOperation({ operationId: 'getStatisticsForDepartment' })
  @ApiParam({ name: 'slug', enum: DepartmentSlugEnum, required: true })
  @ApiResponse({ status: 200, type: GetStatisticsDepartmentResponse })
  async department(
    @Param('slug', new EnumValidationPipe(DepartmentSlugEnum))
    slug: DepartmentSlugEnum,
  ): Promise<GetStatisticsDepartmentResponse> {
    return ResultWrapper.unwrap(
      await this.statisticsService.getDepartment(slug),
    )
  }

  // @UseGuards(TokenJwtAuthGuard, RoleGuard)
  // @Roles(USER_ROLES.Admin) er þetta intentional?
  @Get('/overview/:type')
  @ApiOperation({ operationId: 'getStatisticsOverview' })
  @ApiParam({ name: 'type', enum: StatisticsOverviewQueryType, required: true })
  @ApiResponse({ status: 200, type: GetStatisticsOverviewResponse })
  async overview(
    @Param('type', new EnumValidationPipe(StatisticsOverviewQueryType))
    type: StatisticsOverviewQueryType,
    @CurrentUser() user: AdminUser,
  ): Promise<GetStatisticsOverviewResponse> {
    return ResultWrapper.unwrap(
      await this.statisticsService.getOverview(type, user?.id),
    )
  }
}
