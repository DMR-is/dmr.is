import { Controller, Inject, Param, Put, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
} from '@nestjs/swagger'

import { UserRoleEnum } from '@dmr.is/constants'
import { Roles } from '@dmr.is/decorators'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { IApplicationService } from '@dmr.is/ojoi-modules'
import { RoleGuard } from '@dmr.is/ojoi-modules/guards/auth'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'
import { ResultWrapper } from '@dmr.is/types'

@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, RoleGuard)
@Roles(UserRoleEnum.Admin)
@Controller({
  version: '1',
  path: 'applications',
})
export class ApplicationController {
  constructor(
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,

    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Recovery action: forces a stuck application back to the draft_retry state so
   * the applicant can edit and resubmit. Intended for applications that ended up
   * in the submitted state without a case being created (e.g. island.is errored
   * before reaching our post-application endpoint). Only applications currently in
   * the submitted state can be re-opened.
   */
  @Put(':id/reopen')
  @ApiOperation({ operationId: 'reopenApplication' })
  @ApiNoContentResponse()
  async reopenApplication(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<void> {
    this.logger.info(`Re-opening application<${id}>`)

    ResultWrapper.unwrap(await this.applicationService.reopenApplication(id))
  }
}
