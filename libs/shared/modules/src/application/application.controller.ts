import { Application } from '@dmr.is/shared/dto'

import { Controller, Get, Inject, Param } from '@nestjs/common'
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger'

import { IApplicationService } from './application.service.interface'

@Controller({
  path: 'applications',
  version: '1',
})
export class ApplicationController {
  constructor(
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,
  ) {}

  @Get('health')
  @ApiOperation({
    operationId: 'health',
    summary: 'Health check.',
  })
  @ApiOkResponse({
    type: String,
  })
  async health(): Promise<string> {
    return 'OK'
  }

  @Get(':id')
  @ApiOperation({
    operationId: 'getApplication',
    summary: 'Get application by ID.',
  })
  @ApiOkResponse({
    type: Application,
  })
  async getApplication(@Param('id') id: string): Promise<Application | null> {
    return await this.applicationService.getApplication(id)
  }
}
