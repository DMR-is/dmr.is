import { IApplicationService } from '@dmr.is/modules'
import {
  Application,
  CaseComment,
  GetApplicationResponse,
  GetCaseCommentsResponse,
  PostApplicationComment,
  PostCaseCommentResponse,
  UpdateApplicationBody,
} from '@dmr.is/shared/dto'

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common'
import {
  ApiBody,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger'

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
    type: GetApplicationResponse,
  })
  @ApiExcludeEndpoint()
  async getApplication(
    @Param('id') id: string,
  ): Promise<GetApplicationResponse> {
    const result = await this.applicationService.getApplication(id)

    if (!result.ok) {
      throw new HttpException(result.error.message, result.error.code)
    }

    return Promise.resolve({
      application: result.value.application,
    })
  }

  @Post(':id/submit')
  @ApiOperation({
    operationId: 'submitApplication',
    summary: 'Submit application by ID.',
  })
  @ApiParam({
    type: String,
    name: 'id',
    description: 'Id of the application to submit.',
    required: true,
    allowEmptyValue: false,
  })
  @ApiNoContentResponse()
  @HttpCode(204)
  @ApiExcludeEndpoint()
  async submitApplication(@Param('id') id: string) {
    const results = await this.applicationService.submitApplication(id)

    if (!results.ok) {
      throw new HttpException(results.error.message, results.error.code)
    }

    return Promise.resolve()
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
  @ApiExcludeEndpoint()
  async updateApplication(
    @Param('id') id: string,
    @Body() body: UpdateApplicationBody,
  ): Promise<Application | null> {
    return await this.applicationService.updateApplication(id, body)
  }

  @Post(':id/post')
  @ApiOperation({
    operationId: 'postApplication',
    summary: 'Post application.',
  })
  @ApiParam({
    type: String,
    name: 'id',
    description: 'Id of the application to post.',
    required: true,
    allowEmptyValue: false,
  })
  @ApiNoContentResponse()
  @HttpCode(204)
  async postApplication(@Param('id') applicationId: string) {
    const results = await this.applicationService.postApplication(applicationId)

    if (!results.ok) {
      throw new HttpException(results.error.message, results.error.code)
    }

    return Promise.resolve()
  }

  @Get(':id/comments')
  @ApiOperation({
    operationId: 'getComments',
    summary: 'Get comments by application ID.',
  })
  @ApiOkResponse({
    type: GetCaseCommentsResponse,
  })
  async getComments(
    @Param('id') applicationId: string,
  ): Promise<GetCaseCommentsResponse> {
    const result = await this.applicationService.getComments(applicationId)

    if (!result.ok) {
      throw new HttpException(result.error.message, result.error.code)
    }

    return Promise.resolve({
      comments: result.value.comments,
    })
  }

  @Post(':id/comments')
  @ApiCreatedResponse({
    type: PostCaseCommentResponse,
  })
  @ApiOperation({
    operationId: 'postComment',
    summary: 'Add comment to application.',
  })
  async postComment(
    @Param('id') applicationId: string,
    @Body() commentBody: PostApplicationComment,
  ): Promise<PostCaseCommentResponse> {
    const result = await this.applicationService.postComment(
      applicationId,
      commentBody,
    )

    if (!result.ok) {
      throw new HttpException(result.error.message, result.error.code)
    }

    return Promise.resolve({
      comment: result.value.comment,
    })
  }
}
