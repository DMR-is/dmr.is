import { Body, Controller, Get, Inject, Post } from '@nestjs/common'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import { GetCasesDto } from './dto/case.dto'
import { ICaseService } from './case.service.interface'

@Controller({ path: 'cases', version: '1' })
export class CaseController {
  constructor(
    @Inject(ICaseService) private readonly caseService: ICaseService,
  ) {}

  @Get()
  @LGResponse({ operationId: 'getCases', type: GetCasesDto })
  getCases(): Promise<GetCasesDto> {
    return this.caseService.getCases()
  }

  @Post()
  async create(@Body() body: any): Promise<void> {
    return this.caseService.create(body)
  }
}
