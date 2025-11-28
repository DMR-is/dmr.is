import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { PersonDto } from '@dmr.is/clients/national-registry'
import { TokenJwtAuthGuard } from '@dmr.is/modules/guards/auth'

import { CurrentSubmittee } from '../../core/decorators/current-submittee.decorator'
import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { CurrentNationalRegistryPersonGuard } from '../../core/guards/current-submitte.guard'
import { IslandIsSubmitCommonApplicationDto } from '../../models/application.model'
import { IApplicationService } from '../applications/application.service.interface'

// NOTE: This controller is for island.is application submissions - uses CurrentNationalRegistryPersonGuard
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
    @Body() body: IslandIsSubmitCommonApplicationDto,
    @CurrentSubmittee() submittee: PersonDto,
  ) {
    return this.applicationService.submitIslandIsApplication(body, submittee)
  }
}
