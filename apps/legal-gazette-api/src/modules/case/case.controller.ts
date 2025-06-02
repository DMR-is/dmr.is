import { Controller, Get, Inject, Param, Query } from '@nestjs/common'
import { ApiQuery } from '@nestjs/swagger'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import { CaseDto, CaseQueryDto, GetCasesDto } from './dto/case.dto'
import { ICaseService } from './case.service.interface'

@Controller({ path: 'cases', version: '1' })
export class CaseController {
  constructor(
    @Inject(ICaseService) private readonly caseService: ICaseService,
  ) {}

  @Get()
  @LGResponse({ operationId: 'getCases', type: GetCasesDto })
  getCases(@Query() query: CaseQueryDto): Promise<GetCasesDto> {
    return this.caseService.getCases(query)
  }

  @Get(':id')
  @LGResponse({ operationId: 'getCase', type: CaseDto })
  getCase(@Param('id') id: string): Promise<CaseDto> {
    return this.caseService.getCase(id)
  }
}
