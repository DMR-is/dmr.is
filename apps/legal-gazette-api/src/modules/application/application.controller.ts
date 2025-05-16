import { Body, Controller, Inject, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import { SubmitApplicationDto } from './dto/application.dto'
import { ILegalGazetteApplicationService } from './application.service.interface'

@Controller({
  path: 'applications',
  version: '1',
})
@ApiTags('Legal Gazette Applications')
export class LegalGazetteApplicationController {
  constructor(
    @Inject(ILegalGazetteApplicationService)
    private readonly applicationService: ILegalGazetteApplicationService,
  ) {}

  @Post()
  @LGResponse({ operationId: 'submitApplication', status: 201 })
  async submitApplication(@Body() body: SubmitApplicationDto): Promise<void> {
    return this.applicationService.submitApplication(body)
  }
}
