import {
  Application,
  SubmitApplicationBody,
  UpdateApplicationBody,
} from '@dmr.is/shared/dto'

import { Body, Controller, Get, Inject, Param, Put } from '@nestjs/common'
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger'

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

  @Put(':id/submit')
  @ApiOperation({
    operationId: 'submitApplication',
    summary: 'Submit application by ID.',
  })
  @ApiOkResponse({
    type: Application,
  })
  @ApiParam({
    type: String,
    name: 'id',
    description: 'Id of the application to submit.',
    required: true,
    allowEmptyValue: false,
  })
  @ApiBody({
    type: SubmitApplicationBody,
    required: true,
    description: 'Submit application body, approve or reject the application.',
  })
  async submitApplication(
    @Param('id') id: string,
    @Body() body: SubmitApplicationBody,
  ): Promise<Application | null> {
    return await this.applicationService.submitApplication(id, body)
  }

  @Put(':id')
  @ApiOperation({
    operationId: 'submitApplication',
    summary: 'Update answers of an application.',
  })
  @ApiOkResponse({
    type: Application,
  })
  @ApiParam({
    type: String,
    name: 'id',
    description: 'Id of the application to update.',
    required: true,
    allowEmptyValue: false,
  })
  @ApiBody({
    type: UpdateApplicationBody,
    required: true,
    description: 'Update application body, answers to update.',
  })
  async updateApplication(
    @Param('id') id: string,
    @Body() body: UpdateApplicationBody,
  ): Promise<Application | null> {
    return await this.applicationService.updateApplication(id, body)
  }
}
