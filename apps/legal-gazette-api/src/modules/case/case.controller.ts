import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { LGResponse } from '@dmr.is/legal-gazette/decorators'
import { TokenJwtAuthGuard } from '@dmr.is/modules'
import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { Auth } from '@island.is/auth-nest-tools'

import {
  CaseDetailedDto,
  CaseDto,
  CaseQueryDto,
  GetCasesDto,
} from './dto/case.dto'
import { ICaseService } from './case.service.interface'

@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
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

  @Post()
  @LGResponse({ operationId: 'createCase', type: CaseDto })
  createCase(@CurrentUser() currentUser: Auth): Promise<CaseDto> {
    if (!currentUser?.nationalId) {
      throw new UnauthorizedException('User not authenticated')
    }

    return this.caseService.createCase({
      involvedPartyNationalId: currentUser.nationalId,
    })
  }

  @Get(':id')
  @LGResponse({ operationId: 'getCase', type: CaseDetailedDto })
  getCase(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<CaseDetailedDto> {
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
