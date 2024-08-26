import { LogMethod, Route } from '@dmr.is/decorators'
import { IApplicationService } from '@dmr.is/modules'
import {
  CasePriceResponse,
  GetApplicationResponse,
  GetCaseCommentsResponse,
  PostApplicationComment,
  S3UploadFilesResponse,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { FilesInterceptor } from '@nestjs/platform-express'
import 'multer'
import {
  Body,
  Controller,
  HttpCode,
  Inject,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { UUIDValidationPipe, FileTypeValidationPipe } from '@dmr.is/pipelines'
import { ALLOWED_MIME_TYPES, ONE_MEGA_BYTE } from '@dmr.is/constants'
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger'

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
  @ApiOperation({
    operationId: 'uploadApplicationAttachment',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    type: 'string',
    required: true,
  })
  @ApiBody({
    description: 'Handles uploading attachments for an application.',
    required: true,
    schema: {
      type: 'object',
      properties: {
        files: {
          description: 'The attachments',
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'The attachments were uploaded successfully.',
    type: S3UploadFilesResponse,
  })
  @HttpCode(200)
  @UseInterceptors(FilesInterceptor('files'))
  @LogMethod()
  async uploadApplicationAttachment(
    @Param('id', UUIDValidationPipe) applicationId: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: ONE_MEGA_BYTE * 20,
            message: `File size exceeds the limit of 10MB.`,
          }),
          new FileTypeValidationPipe({
            mimetype: ALLOWED_MIME_TYPES,
            maxNumberOfFiles: 5,
          }),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
  ): Promise<S3UploadFilesResponse> {
    return ResultWrapper.unwrap(
      await this.applicationService.uploadAttachments(applicationId, files),
    )
  }
}
