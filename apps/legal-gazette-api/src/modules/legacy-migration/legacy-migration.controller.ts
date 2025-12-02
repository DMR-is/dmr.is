import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import { PublicWebScopes, TokenJwtAuthGuard } from '@dmr.is/modules/guards/auth'

import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../core/guards/authorization.guard'
import { SubscriberDto } from '../../models/subscriber.model'
import {
  CheckLegacyEmailDto,
  CheckLegacyEmailResponseDto,
  CompleteMigrationDto,
  RequestMigrationDto,
} from './legacy-migration.dto'
import {
  CheckLegacyEmailResult,
  ILegacyMigrationService,
} from './legacy-migration.service.interface'

@ApiTags('Legacy Migration')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@PublicWebScopes()
@Controller({
  path: 'legacy-migration',
  version: '1',
})
export class LegacyMigrationController {
  constructor(
    @Inject(ILegacyMigrationService)
    private readonly legacyMigrationService: ILegacyMigrationService,
  ) {}

  @Post('check-email')
  @ApiOperation({
    summary: 'Check if email exists in legacy system',
    description:
      'Checks if the provided email exists in the legacy subscriber table and whether it has an associated kennitala.',
  })
  @LGResponse({
    operationId: 'checkLegacyEmail',
    type: CheckLegacyEmailResponseDto,
  })
  async checkLegacyEmail(
    @Body() dto: CheckLegacyEmailDto,
  ): Promise<CheckLegacyEmailResult> {
    return this.legacyMigrationService.checkLegacyEmail(dto.email)
  }

  @Post('request')
  @ApiOperation({
    summary: 'Request magic link for migration',
    description:
      'Sends a magic link email to the legacy email address for account migration. The authenticated user must click the link to complete migration.',
  })
  @LGResponse({
    operationId: 'requestLegacyMigration',
    type: undefined,
  })
  async requestMigration(
    @Body() dto: RequestMigrationDto,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.legacyMigrationService.requestMigration(
      dto.email,
      user.nationalId,
    )
  }

  @Post('complete')
  @ApiOperation({
    summary: 'Complete migration with token verification',
    description:
      'Completes the migration process by verifying the magic link token. The authenticated nationalId must match the token target.',
  })
  @LGResponse({
    operationId: 'completeLegacyMigration',
    type: SubscriberDto,
  })
  async completeMigration(
    @Body() dto: CompleteMigrationDto,
    @CurrentUser() user: DMRUser,
  ): Promise<SubscriberDto> {
    return this.legacyMigrationService.completeMigration(
      dto.token,
      user.nationalId,
    )
  }
}
