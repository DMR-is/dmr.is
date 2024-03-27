import { Controller, Get, Inject, Param, Query } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { ICaseService } from './case.service.interface'

import { Case, GetCasesReponse, GetCasesQuery } from '@dmr.is/shared/dto'

@Controller({
  version: '1',
})
export class CaseController {
  constructor(
    @Inject(ICaseService) private readonly caseService: ICaseService,
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
    type: CaseOverviewResponse,
    description: 'Cases overview.',
  })
  async getEditorialOverview(
    @Query() params?: CasesQuery,
  ): Promise<CaseOverviewResponse> {
    return this.caseService.getEditorialOverview(params)
  }
}
