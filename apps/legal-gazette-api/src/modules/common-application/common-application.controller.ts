import { Body, Controller, Delete, Inject, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { LegalGazetteApiTags } from '@dmr.is/legal-gazette/constants'
import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import { SubmitCommonApplicationDto } from './dto/common-application.dto'
import { ICommonApplicationService } from './common-application.service.interface'

@Controller({
  path: 'applications',
  version: '1',
})
export class CommonApplicationController {
  constructor(
    @Inject(ICommonApplicationService)
    private readonly applicationService: ICommonApplicationService,
  ) {}

  @Post()
  @LGResponse({ operationId: 'submitApplication', status: 201 })
  @ApiTags(LegalGazetteApiTags.APPLICATION_API)
  async submitApplication(
    @Body() body: SubmitCommonApplicationDto,
  ): Promise<void> {
    return this.applicationService.submitApplication(body)
  }

  @Delete(':id')
  @LGResponse({ operationId: 'deleteApplication' })
  @ApiTags(LegalGazetteApiTags.APPLICATION_API)
  async deleteApplication(@Param('id') id: string): Promise<void> {
    await this.applicationService.deleteApplication(id)
  }
}
