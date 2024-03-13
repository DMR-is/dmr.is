import { Controller, Get, Inject, Param, Query } from '@nestjs/common'
import { ApiQuery, ApiResponse } from '@nestjs/swagger'
import { Case } from '../../dto/case/case.dto'
import { ICaseService } from './case.service.interface'
import { CasesReponse } from '../../dto/case/cases-response'
import { CasesQuery } from '../../dto/case/cases-query.dto'

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
  @ApiQuery({
    name: 'params',
    type: CasesQuery,
    required: false,
  })
  async cases(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('caseNumber') caseNumber?: string,
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('fastTrack') fastTrack?: boolean,
  ): Promise<CasesReponse> {
    return this.caseService.getCases({
      search,
      page: page ? page : undefined, // prevent NaN
      caseNumber,
      status,
      employeeId,
      dateFrom,
      dateTo,
      fastTrack,
    })
  }
}
