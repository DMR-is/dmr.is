import { Controller, Get, Inject, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

import { IRegulationAppendicesService } from '@dmr.is/ojoi-modules'
import {
  GetRegulationAppendicesQuery,
  GetRegulationAppendicesResponse,
} from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

/**
 * Lookups for the regulation importer.
 *
 * Regulations published while the direct-publish flow is off go to the old
 * regulation system without their appendices, which only exist here as case
 * additions. The importer fetches them by publication number.
 *
 * Unauthenticated on purpose: it returns only what `/adverts/:id` already
 * exposes for published adverts, and the batch cap on the query bounds the
 * cost of a call.
 *
 * TEMPORARY - remove this controller, `RegulationsModule`, the
 * `regulation-appendices` module in `@dmr.is/ojoi-modules` and
 * `regulation-appendices.dto.ts` once all three hold:
 *
 * 1. The direct-publish flag is on, so `base_regulation` /
 *    `amending_regulation` cases publish through `publishRegulationDirectly`,
 *    which sends the draft's appendices to regulations-api itself.
 * 2. No regulation goes through Eplica any more. Even with the flag on, an
 *    amending regulation whose base regulation has pending tasks still falls
 *    back to `ExternalService.publishRegulation`
 *    (`CaseService.publishRegulationByType`) and loses its appendices.
 * 3. The regulation importer has caught up on regulations it imported
 *    without appendices, and no longer calls this route.
 */
@Controller({
  path: 'regulations',
  version: '1',
})
export class RegulationsController {
  constructor(
    @Inject(IRegulationAppendicesService)
    private readonly regulationAppendicesService: IRegulationAppendicesService,
  ) {}

  @Get('/appendices')
  @ApiOperation({
    operationId: 'getRegulationAppendices',
    summary:
      'Appendices of published B-deild adverts, looked up by publication number.',
  })
  @ApiResponse({ status: 200, type: GetRegulationAppendicesResponse })
  @ApiResponse({
    status: 400,
    description:
      'A publication number is malformed, or more than the allowed number were sent.',
  })
  async getAppendices(
    @Query() query: GetRegulationAppendicesQuery,
  ): Promise<GetRegulationAppendicesResponse> {
    return ResultWrapper.unwrap(
      await this.regulationAppendicesService.getAppendices(
        query.publicationNumber,
      ),
    )
  }
}
