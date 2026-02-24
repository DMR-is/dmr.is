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
import { Auth } from '@dmr.is/island-auth-nest'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AdminAccess } from '../../core/decorators/admin.decorator'
import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../core/guards/authorization.guard'
import { CaseDto, CaseQueryDto, GetCasesDto } from '../../models/case.model'
import { ICaseService } from './case.service.interface'

// TODO: Determine usage - currently no tRPC routers call this controller
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
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
