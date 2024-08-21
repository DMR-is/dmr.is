import { Route } from '@dmr.is/decorators'
import { IApplicationService } from '@dmr.is/modules'
import {
  CasePriceResponse,
  GetApplicationResponse,
  GetCaseCommentsResponse,
  PostApplicationComment,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { FileInterceptor } from '@nestjs/platform-express'
import 'multer'
import {
  Body,
  Controller,
  Inject,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { UUIDValidationPipe } from '@dmr.is/pipelines'

@Controller({
  path: 'applications',
  version: '1',
})
/**
 * Controller class for handling application-related requests.
 */
export class ApplicationController {
  constructor(
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,
  ) {}

  /**
   * Retrieves the price of an application.
   * @param applicationId The ID of the application.
   * @returns A promise that resolves to the price of the application.
   */
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

  /**
   * Retrieves an application by its ID.
   * @param id The ID of the application.
   * @returns A promise that resolves to the application.
   */
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

  // @Route({
  //   method: 'post',
  //   path: ':id/submit',
  //   operationId: 'submitApplication',
  //   params: [{ name: 'id', type: 'string', required: true }],
  //   exclude: true,
  // })
  // async submitApplication(@Param('id') id: string) {
  //   ResultWrapper.unwrap(await this.applicationService.submitApplication(id))
  // }

  // @Route({
  //   method: 'put',
  //   path: ':id',
  //   operationId: 'updateApplication',
  //   params: [{ name: 'id', type: 'string', required: true }],
  //   bodyType: UpdateApplicationBody,
  //   exclude: true,
  // })
  // async updateApplication(
  //   @Param('id') id: string,
  //   @Body() body: UpdateApplicationBody,
  // ) {
  //   ResultWrapper.unwrap(
  //     await this.applicationService.updateApplication(id, body),
  //   )
  // }

  /**
   * Handles submissions from the application system.
   * @param applicationId The ID of the application.
   * @returns A promise that resolves when the application is posted.
   */
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

  /**
   * Retrieves the comments of an application.
   * @param applicationId The ID of the application.
   * @returns A promise that resolves to the comments of the application.
   */
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

  /**
   * Posts a comment on an application.
   * @param applicationId The ID of the application.
   * @param commentBody The body of the comment.
   * @returns A promise that resolves when the comment is posted.
   */
  @Route({
    method: 'post',
    path: ':id/comments',
    operationId: 'postComment',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: PostApplicationComment,
  })
  async postComment(
    @Param('id') applicationId: string,
    @Body() commentBody: PostApplicationComment,
  ): Promise<void> {
    ResultWrapper.unwrap(
      await this.applicationService.postComment(applicationId, commentBody),
    )
  }

  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadApplicationAttachment(
    @Param('id', UUIDValidationPipe) applicationId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    ResultWrapper.unwrap(
      await this.applicationService.uploadAttachment(applicationId, file),
    )
  }
}
