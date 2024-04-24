import {
  Application,
  CaseComment,
  PostApplicationComment,
  SubmitApplicationBody,
  UpdateApplicationBody,
} from '@dmr.is/shared/dto'

import { Body, Controller, Get, Inject, Param, Post, Put } from '@nestjs/common'
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
    operationId: 'updateApplication',
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

  @Get(':id/comments')
  @ApiOperation({
    operationId: 'getComments',
    summary: 'Get comments by application ID.',
  })
  @ApiOkResponse({
    type: [CaseComment],
  })
  async getComments(@Param('id') applicationId: string) {
    return await this.applicationService.getComments(applicationId)
  }

  @Post(':id/comments')
  @ApiOperation({
    operationId: 'addComment',
    summary: 'Add comment to application.',
  })
  @ApiOkResponse({
    type: [CaseComment],
  })
  async postComment(
    @Param('id') applicationId: string,
    @Body() commentBody: PostApplicationComment,
  ) {
    return await this.applicationService.postComment(applicationId, commentBody)
  }
}
