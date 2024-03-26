import { Controller, Get, Inject, Param, Query } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { ICaseService } from './case.service.interface'

import { Case, CasesReponse, CasesQuery } from '@dmr.is/shared/dto/cases'

@Controller({
  version: '1',
})
export class CaseController {
  constructor(
    @Inject(ICaseService) private readonly caseService: ICaseService,
  ) {}

  @Get('/:id')
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
  @ApiResponse({
    status: 200,
    type: CasesReponse,
    description: 'All cases.',
  })
  async cases(@Query() params?: CasesQuery): Promise<CasesReponse> {
    return this.caseService.getCases(params)
  }
}
