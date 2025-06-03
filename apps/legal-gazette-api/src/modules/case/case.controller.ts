import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common'

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

  @Post(':id/restore')
  @LGResponse({ operationId: 'restore', type: CaseDto })
  restoreCase(@Param('id') id: string): Promise<CaseDto> {
    return this.caseService.restoreCase(id)
  }

  @Delete(':id')
  @LGResponse({ operationId: 'deleteCase' })
  deleteCase(@Param('id') id: string): Promise<void> {
    return this.caseService.deleteCase(id)
  }
}
