import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { CurrentNationalRegistryPersonGuard } from '../../core/guards/current-submitte.guard'
import { IApplicationService } from '../applications/application.service.interface'
import { IslandIsSubmitApplicationDto } from '../applications/dto/application-extra.dto'

@Controller({
  path: 'applications/island-is',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, CurrentNationalRegistryPersonGuard)
export class IslandIsApplicationController {
  constructor(
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,
  ) {}

  @Post('submit')
  @LGResponse({ operationId: 'submitIslandIsApplication', status: 201 })
  async submitApplication(
    @Body() body: IslandIsSubmitApplicationDto,
    @CurrentUser() user: DMRUser,
  ) {
    return this.applicationService.submitIslandIsApplication(body, user)
  }
}
