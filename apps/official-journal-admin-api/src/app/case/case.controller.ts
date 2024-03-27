import { Controller, Get, Inject, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { Case } from '../../dto/case/case.dto'
import { ICaseService } from './case.service.interface'
import { CasesReponse } from '../../dto/case/cases-response'
import { CasesQuery } from '../../dto/case/cases-query.dto'
import { CaseOverviewResponse } from '../../dto/case/case-overview.dto'

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
    type: CasesReponse,
    description: 'All cases.',
  })
  async cases(@Query() params?: CasesQuery): Promise<CasesReponse> {
    return this.caseService.getCases(params)
  }

  @Get('/overview/editorial')
  @ApiOperation({
    operationId: 'getCasesOverview',
    summary: 'Get cases overview for editorial cases.',
  })
  @ApiResponse({
    status: 200,
    type: CaseOverviewResponse,
    description: 'Cases overview.',
  })
  async caseOverview(
    @Query() params?: CasesQuery,
  ): Promise<CaseOverviewResponse> {
    return this.caseService.getCasesOverview(params)
  }
}
