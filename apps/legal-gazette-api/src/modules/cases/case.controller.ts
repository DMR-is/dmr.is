import { Controller, Get, Inject } from '@nestjs/common'

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
}
