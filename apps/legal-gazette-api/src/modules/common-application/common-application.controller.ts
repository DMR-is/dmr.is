import { Body, Controller, Inject, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { LegalGazetteApiTags } from '@dmr.is/legal-gazette/constants'
import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import { SubmitApplicationDto } from './dto/common-application.dto'
import { ICommonApplicationService } from './common-application.service.interface'

@Controller({
  path: 'applications',
  version: '1',
})
@ApiTags(LegalGazetteApiTags.APPLICATION_API)
export class CommonApplicationController {
  constructor(
    @Inject(ICommonApplicationService)
    private readonly applicationService: ICommonApplicationService,
  ) {}

  @Post()
  @LGResponse({ operationId: 'submitApplication', status: 201 })
  async submitApplication(@Body() body: SubmitApplicationDto): Promise<void> {
    return this.applicationService.submitApplication(body)
  }
}
