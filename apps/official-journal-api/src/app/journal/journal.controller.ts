import { DefaultSearchParams } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Controller, Get, Inject, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

import { GetCasesInProgressReponse } from './dto/get-cases-in-progress-response.dto'
import { IJournalService } from './journal.service.interface'
@Controller({
  version: '1',
})
export class JournalController {
  constructor(
    @Inject(IJournalService) private readonly journalService: IJournalService,
  ) {}

  @Get('/cases')
  @ApiOperation({ operationId: 'getCasesInProgress' })
  @ApiResponse({ status: 200, type: GetCasesInProgressReponse })
  async getCasesInProgress(
    @Query()
    params?: DefaultSearchParams,
  ): Promise<GetCasesInProgressReponse> {
    return ResultWrapper.unwrap(
      await this.journalService.getCasesInProgress(params),
    )
  }
}
