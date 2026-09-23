import { Controller, Get, Inject } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import {
  AggregateStatisticsDto,
  IAggregateStatisticsService,
} from '@dmr.is/doe-modules/aggregate-statistics'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { PublicRoute } from '../../core/decorators/public-route.decorator'

/**
 * Aggregate register figures for the Jafnréttisstofa website.
 *
 * Part of the APPLICATION surface — same `application/v1` prefix and the same
 * X-Road service (`api.ritstjorn-jafnretti`) as the rest of it — not a separate
 * public API. What differs is only that it needs no CITIZEN identity: the
 * island.is Chart query that feeds it (`getStatisticsByKeys`) is itself
 * unauthenticated, so there is no citizen token to exchange. X-Road still
 * authenticates the island.is member at the gateway.
 *
 * ⚠️ That makes this the one handler here with no citizen guard, and the
 * `@PublicRoute` reason below is its whole justification: everything returned
 * is an aggregate over the register and the endpoint takes no parameters, so
 * there is nothing a caller can narrow. A filter argument would let one shrink
 * an aggregate until it described a single company; a per-company field would
 * skip that step. Neither belongs on this controller.
 *
 * `swagger-coverage.spec.ts` fails unless this controller is in its
 * `PUBLIC_ROUTE_ALLOWLIST`, so it cannot lose its citizen guard quietly.
 */
@Controller({ path: 'application/statistics', version: '1' })
@ApiTags('Application')
@PublicRoute(
  'Aggregate register figures published on jafnretti.is. Fed by the unauthenticated island.is Chart query, which carries no citizen token to exchange. No parameters and no per-company field, so nothing here can be narrowed to an individual company.',
)
export class AggregateStatisticsController {
  constructor(
    @Inject(IAggregateStatisticsService)
    private readonly publicStatisticsService: IAggregateStatisticsService,
  ) {}

  @Get()
  @DoeResponse({
    operationId: 'getAggregateStatistics',
    type: AggregateStatisticsDto,
    successDescription:
      'Aggregate coverage, sector and pay-gap figures, as current values and monthly series.',
    // No 401/403: the route is deliberately unauthenticated, and documenting
    // them would describe responses it cannot produce.
    errors: [500],
  })
  getStatistics(): Promise<AggregateStatisticsDto> {
    return this.publicStatisticsService.getStatistics()
  }
}
