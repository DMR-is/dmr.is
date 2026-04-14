import { Controller, Inject, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AdminAccess } from '../../core/decorators/admin.decorator'
import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../core/guards/authorization.guard'
import {
  BackfillHtmlQueryDto,
  BackfillHtmlResponseDto,
} from './dto/html-admin.dto'
import { IHtmlAdminService } from './html-admin.service.interface'

@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
@ApiTags('HTML Admin')
@Controller({
  path: 'html-admin',
  version: '1',
})
export class HtmlAdminController {
  constructor(
    @Inject(IHtmlAdminService)
    private readonly htmlAdminService: IHtmlAdminService,
  ) {}

  @Post('backfill')
  @LGResponse({
    operationId: 'backfillPublishedHtml',
    type: BackfillHtmlResponseDto,
    description:
      'Generates and persists HTML for all published adverts missing it',
  })
  backfillPublishedHtml(
    @Query() query: BackfillHtmlQueryDto,
    @CurrentUser() user: DMRUser,
  ): Promise<BackfillHtmlResponseDto> {
    if (query.dryRun) {
      return this.htmlAdminService.previewBackfill(user)
    }

    return this.htmlAdminService.runBackfill(user)
  }
}
