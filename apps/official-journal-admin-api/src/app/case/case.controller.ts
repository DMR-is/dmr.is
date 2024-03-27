import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  Case,
  CaseEditorialOverview,
  GetCasesQuery,
  GetCasesReponse,
} from '@dmr.is/shared/dto'

import { Controller, Get, Inject, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

import { ICaseService } from './case.service.interface'

@Controller({
  version: '1',
})
export class CaseController {
  constructor(
    @Inject(ICaseService)
    private readonly caseService: ICaseService,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  @Get('/:id')
  @ApiOperation({
    operationId: 'getCase',
    summary: 'Get case by ID.',
  })
  @ApiResponse({
    status: 200,
    type: Case,
    description: 'Case by ID.',
  })
  @ApiResponse({
    status: 404,
    description: 'Case not found.',
  })
  async case(@Param('id') id: string): Promise<Case | null> {
    return this.caseService.getCase(id)
  }

  @Get('/')
  @ApiOperation({
    operationId: 'getCases',
    summary: 'Get cases.',
  })
  @ApiResponse({
    status: 200,
    type: GetCasesReponse,
    description: 'All cases.',
  })
  async cases(@Query() params?: GetCasesQuery): Promise<GetCasesReponse> {
    return this.caseService.getCases(params)
  }

  @Get('/overview/editorial')
  @ApiOperation({
    operationId: 'getEditorialOverview',
    summary: 'Get overview for cases in progress.',
  })
  @ApiResponse({
    status: 200,
    type: CaseEditorialOverview,
    description: 'Cases overview.',
  })
  async editorialOverview(
    @Query() params?: GetCasesQuery,
  ): Promise<CaseEditorialOverview> {
    return this.caseService.getEditorialOverview(params)
  }
}
