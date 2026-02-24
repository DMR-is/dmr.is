import { Controller, Get, Inject, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AdminAccess } from '../../../core/decorators/admin.decorator'
import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import {
  GetAdvertsInProgressStatsDto,
  GetAdvertsToBePublishedStatsDto,
  GetCountByStatusesDto,
} from './statistics.dto'
import { IStatisticsService } from './statistics.service.interface'

@Controller({
  path: 'statistics',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
export class StatisticsController {
  constructor(
    @Inject(IStatisticsService)
    private readonly statisticsService: IStatisticsService,
  ) {}

  @Get()
  @LGResponse({
    operationId: 'getCountByStatuses',
    type: GetCountByStatusesDto,
  })
  getCountByStatuses(): Promise<GetCountByStatusesDto> {
    return this.statisticsService.getCountByStatuses()
  }

  @Get('in-progress')
  @LGResponse({
    operationId: 'getAdvertsInProgressStats',
    type: GetAdvertsInProgressStatsDto,
  })
  getAdvertsInProgressStats() {
    return this.statisticsService.getAdvertsInProgressStats()
  }

  @Get('to-be-published')
  @LGResponse({
    operationId: 'getAdvertsToBePublishedStats',
    type: GetAdvertsToBePublishedStatsDto,
  })
  getAdvertsToBePublishedStats() {
    return this.statisticsService.getAdvertsToBePublishedStats()
  }
}
