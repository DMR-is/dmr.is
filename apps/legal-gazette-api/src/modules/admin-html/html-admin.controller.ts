import {
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AdminAccess } from '../../core/decorators/admin.decorator'
import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../core/guards/authorization.guard'
import {
  BackfilledPublicationsListDto,
  BackfilledPublicationsQueryDto,
  BackfillHtmlResponseDto,
  BackfillJobStatusDto,
  BackfillStartResponseDto,
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
    description: 'Preview backfill (dryRun=true) or start backfill job',
  })
  backfillPublishedHtml(
    @Query('dryRun') dryRun: string,
    @CurrentUser() user: DMRUser,
  ): Promise<BackfillHtmlResponseDto> {
    if (dryRun === 'true') {
      return this.htmlAdminService.previewBackfill(user)
    }

    return Promise.resolve(this.htmlAdminService.startBackfill(user))
  }

  @Get('backfill/status')
  @LGResponse({
    operationId: 'getBackfillStatus',
    type: BackfillJobStatusDto,
    description: 'Get current backfill job status',
  })
  getBackfillStatus(): BackfillJobStatusDto {
    return this.htmlAdminService.getBackfillStatus()
  }

  @Get('backfill/history')
  @LGResponse({
    operationId: 'getBackfilledPublications',
    type: BackfilledPublicationsListDto,
    description: 'Get paginated list of backfilled publications',
  })
  getBackfilledPublications(
    @Query() query: BackfilledPublicationsQueryDto,
  ): Promise<BackfilledPublicationsListDto> {
    return this.htmlAdminService.getBackfilledPublications(query)
  }

  @Post('backfill/revert')
  @HttpCode(202)
  @LGResponse({
    operationId: 'startBackfillRevert',
    type: BackfillStartResponseDto,
    status: 202,
    description: 'Start reverting all backfilled publications',
  })
  startBackfillRevert(@CurrentUser() user: DMRUser): BackfillStartResponseDto {
    return this.htmlAdminService.startRevert(user)
  }

  @Get('backfill/revert/status')
  @LGResponse({
    operationId: 'getRevertStatus',
    type: BackfillJobStatusDto,
    description: 'Get current revert job status',
  })
  getRevertStatus(): BackfillJobStatusDto {
    return this.htmlAdminService.getRevertStatus()
  }
}
