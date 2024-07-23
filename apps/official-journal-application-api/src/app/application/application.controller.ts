import { LogMethod } from '@dmr.is/decorators'
import { IApplicationService } from '@dmr.is/modules'
import {
  CasePriceResponse,
  GetApplicationResponse,
  GetCaseCommentsResponse,
  PostApplicationComment,
  PostCaseCommentResponse,
  UpdateApplicationBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import {
  Body,
  Controller,
  Get,
  HttpCode,
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

  @Get(':id/price')
  @ApiOperation({
    operationId: 'getPrice',
    summary: 'Get price of application by ID.',
  })
  @ApiParam({
    type: String,
    name: 'id',
    description: 'Id of the application to get price.',
    required: true,
    allowEmptyValue: false,
  })
  @ApiOkResponse({
    type: CasePriceResponse,
  })
  @LogMethod()
  async getPrice(
    @Param('id') applicationId: string,
  ): Promise<CasePriceResponse> {
    return ResultWrapper.unwrap(
      await this.applicationService.getPrice(applicationId),
    )
  }

  @Get(':id')
  @ApiOperation({
    operationId: 'getApplication',
    summary: 'Get application by ID.',
  })
  @ApiOkResponse({
    type: GetApplicationResponse,
  })
  @ApiExcludeEndpoint()
  @ApiParam({
    type: String,
    name: 'id',
    description: 'Id of the application to get.',
    required: true,
    allowEmptyValue: false,
  })
  @LogMethod()
  async getApplication(
    @Param('id') id: string,
  ): Promise<GetApplicationResponse> {
    return ResultWrapper.unwrap(
      await this.applicationService.getApplication(id),
    )
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
  @LogMethod()
  async submitApplication(@Param('id') id: string) {
    ResultWrapper.unwrap(await this.applicationService.submitApplication(id))
  }

  @Put(':id')
  @ApiOperation({
    operationId: 'updateApplication',
    summary: 'Update answers of an application.',
  })
  @ApiNoContentResponse()
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
  @LogMethod()
  async updateApplication(
    @Param('id') id: string,
    @Body() body: UpdateApplicationBody,
  ) {
    ResultWrapper.unwrap(
      await this.applicationService.updateApplication(id, body),
    )
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
  @LogMethod()
  async postApplication(@Param('id') applicationId: string) {
    return ResultWrapper.unwrap(
      await this.applicationService.postApplication(applicationId),
    )
  }

  @Get(':id/comments')
  @ApiOperation({
    operationId: 'getComments',
    summary: 'Get comments by application ID.',
  })
  @ApiOkResponse({
    type: GetCaseCommentsResponse,
  })
  @LogMethod()
  async getComments(
    @Param('id') applicationId: string,
  ): Promise<GetCaseCommentsResponse> {
    return ResultWrapper.unwrap(
      await this.applicationService.getComments(applicationId),
    )
  }

  @Post(':id/comments')
  @ApiCreatedResponse({
    type: PostCaseCommentResponse,
  })
  @ApiOperation({
    operationId: 'postComment',
    summary: 'Add comment to application.',
  })
  @LogMethod()
  async postComment(
    @Param('id') applicationId: string,
    @Body() commentBody: PostApplicationComment,
  ): Promise<PostCaseCommentResponse> {
    return ResultWrapper.unwrap(
      await this.applicationService.postComment(applicationId, commentBody),
    )
  }
}
