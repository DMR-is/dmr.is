import { Route } from '@dmr.is/decorators'
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

import { Body, Controller, Inject, Param } from '@nestjs/common'

@Controller({
  path: 'applications',
  version: '1',
})
export class ApplicationController {
  constructor(
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,
  ) {}

  @Route({
    path: ':id/price',
    operationId: 'getPrice',
    params: [{ name: 'id', type: 'string', required: true }],
    responseType: CasePriceResponse,
  })
  async getPrice(
    @Param('id') applicationId: string,
  ): Promise<CasePriceResponse> {
    return ResultWrapper.unwrap(
      await this.applicationService.getPrice(applicationId),
    )
  }

  @Route({
    path: ':id',
    operationId: 'getApplication',
    params: [{ name: 'id', type: 'string', required: true }],
    responseType: GetApplicationResponse,
  })
  async getApplication(
    @Param('id') id: string,
  ): Promise<GetApplicationResponse> {
    return ResultWrapper.unwrap(
      await this.applicationService.getApplication(id),
    )
  }

  @Route({
    method: 'post',
    path: ':id/submit',
    operationId: 'submitApplication',
    params: [{ name: 'id', type: 'string', required: true }],
    exclude: true,
  })
  async submitApplication(@Param('id') id: string) {
    ResultWrapper.unwrap(await this.applicationService.submitApplication(id))
  }

  @Route({
    method: 'put',
    path: ':id',
    operationId: 'updateApplication',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: UpdateApplicationBody,
    exclude: true,
  })
  async updateApplication(
    @Param('id') id: string,
    @Body() body: UpdateApplicationBody,
  ) {
    ResultWrapper.unwrap(
      await this.applicationService.updateApplication(id, body),
    )
  }

  @Route({
    method: 'post',
    path: ':id/post',
    operationId: 'postApplication',
    params: [{ name: 'id', type: 'string', required: true }],
  })
  async postApplication(@Param('id') applicationId: string) {
    return ResultWrapper.unwrap(
      await this.applicationService.postApplication(applicationId),
    )
  }

  @Route({
    path: ':id/comments',
    operationId: 'getComments',
    params: [{ name: 'id', type: 'string', required: true }],
    responseType: GetCaseCommentsResponse,
  })
  async getComments(
    @Param('id') applicationId: string,
  ): Promise<GetCaseCommentsResponse> {
    return ResultWrapper.unwrap(
      await this.applicationService.getComments(applicationId),
    )
  }

  @Route({
    method: 'post',
    path: ':id/comments',
    operationId: 'postComment',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: PostApplicationComment,
    responseType: PostCaseCommentResponse,
  })
  async postComment(
    @Param('id') applicationId: string,
    @Body() commentBody: PostApplicationComment,
  ): Promise<PostCaseCommentResponse> {
    return ResultWrapper.unwrap(
      await this.applicationService.postComment(applicationId, commentBody),
    )
  }
}
