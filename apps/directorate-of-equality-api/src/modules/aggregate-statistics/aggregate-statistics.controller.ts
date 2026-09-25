import type { Response } from 'express'

import { Controller, Get, Inject, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import {
  AggregateStatisticsDto,
  IAggregateStatisticsService,
} from '@dmr.is/doe-modules/aggregate-statistics'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { PublicRoute } from '../../core/decorators/public-route.decorator'

/**
 * Aggregate register figures for the Jafnlaunakerfi dashboard on island.is.
 *
 * Its own surface, like Official Journal's public API: own prefix, own swagger
 * document (`swagger/statistics`) and own X-Road service, so no applicant
 * client carries it and no statistics consumer needs rights on the
 * application service.
 *
 * No credential is checked here. The API sits behind the internal ALB, which
 * admits only the X-Road VPC and the DoE private subnets; that network is the
 * boundary, not X-Road headers, which this API does not read.
 *
 * ⚠️ `@PublicRoute` is justified only because the handler takes no parameters
 * and returns counts. A filter argument or a per-company field would let a
 * caller narrow a figure to one company. Neither belongs on this controller.
 */
@Controller({ path: 'statistics', version: '1' })
@ApiTags('Statistics')
@PublicRoute(
  'Aggregate register counts for the Jafnlaunakerfi dashboard on island.is, fetched by an unauthenticated island.is query. No parameters and no per-company field, so nothing here can be narrowed to an individual company.',
)
export class AggregateStatisticsController {
  constructor(
    @Inject(IAggregateStatisticsService)
    private readonly statisticsService: IAggregateStatisticsService,
  ) {}

  @Get()
  @DoeResponse({
    operationId: 'getStatistics',
    type: AggregateStatisticsDto,
    successDescription:
      'Company counts by region, size, sector and status, validity rounds and national headcounts. Recomputed once a day.',
    // No 401/403: the route is deliberately unauthenticated.
    errors: [500],
  })
  async getStatistics(
    @Res({ passthrough: true }) res: Response,
  ): Promise<AggregateStatisticsDto> {
    const statistics = await this.statisticsService.getStatistics()
    const maxAge = Math.max(
      0,
      Math.floor((statistics.expiresAt.getTime() - Date.now()) / 1000),
    )
    res.setHeader('Cache-Control', `public, max-age=${maxAge}`)
    return statistics
  }
}
