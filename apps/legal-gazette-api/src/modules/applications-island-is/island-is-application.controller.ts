import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import { TokenJwtAuthGuard } from '@dmr.is/modules/guards/auth'

import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { CurrentNationalRegistryPersonGuard } from '../../core/guards/current-submitte.guard'
import { IslandIsSubmitApplicationDto } from '../../models/application.model'
import { IApplicationService } from '../applications/application.service.interface'

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
