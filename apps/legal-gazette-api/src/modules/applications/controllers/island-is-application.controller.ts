import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { PersonDto } from '@dmr.is/clients/national-registry'
import { TokenJwtAuthGuard } from '@dmr.is/modules'

import { CurrentSubmittee } from '../../../decorators/current-submittee.decorator'
import { LGResponse } from '../../../decorators/lg-response.decorator'
import { CurrentNationalRegistryPersonGuard } from '../../../guards/current-submitte.guard'
import { IApplicationService } from '../application.service.interface'
import { IslandIsSubmitCommonApplicationDto } from '../dto/island-is-application.dto'

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
