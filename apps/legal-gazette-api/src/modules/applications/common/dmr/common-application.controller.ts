import { Controller, Inject, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/modules'

import { CommonApplicationService } from './common-application.service'

@Controller({
  path: 'applications/common',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
export class CommonApplicationController {
  constructor(
    @Inject(CommonApplicationService)
    private readonly applicationService: CommonApplicationService,
  ) {}
}
