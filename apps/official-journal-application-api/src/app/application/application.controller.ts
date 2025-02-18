import { CurrentUser, LogMethod, Route, WithCase } from '@dmr.is/decorators'
import {
  ApplicationAuthGaurd,
  IApplicationService,
  IApplicationUserService,
  ISignatureService,
} from '@dmr.is/modules'
import {
  AdvertTemplateTypeEnums,
  ApplicationUser,
  ApplicationUserInvolvedPartiesResponse,
  CasePriceResponse,
  GetAdvertTemplateResponse,
  AdvertTemplateDetails,
  GetApplicationAttachmentsResponse,
  GetApplicationCaseResponse,
  GetApplicationResponse,
  GetPresignedUrlBody,
  PostApplicationAttachmentBody,
  PostApplicationComment,
  PresignedUrlResponse,
  S3UploadFilesResponse,
  GetComments,
  GetSignature,
  GetApplicationAdvertsQuery,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { FilesInterceptor } from '@nestjs/platform-express'
import 'multer'
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import {
  UUIDValidationPipe,
  FileTypeValidationPipe,
  EnumValidationPipe,
  IsStringValidationPipe,
} from '@dmr.is/pipelines'
import {
  ALLOWED_MIME_TYPES,
  AttachmentTypeParam,
  ONE_MEGA_BYTE,
} from '@dmr.is/constants'
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

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

    @Inject(ISignatureService)
    private readonly signatureService: ISignatureService,

    @Inject(IApplicationUserService)
    private readonly applicationUserService: IApplicationUserService,

    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  @UseGuards(ApplicationAuthGaurd)
  @WithCase(false)
  @Get('/adverts')
  @ApiOperation({
    operationId: 'getAdvertCopies',
  })
  @ApiQuery({ type: GetApplicationAdvertsQuery, required: false })
  @ApiResponse({
    type: GetApplicationResponse,
  })
  async getAdvertCopies(@Query() query: GetApplicationAdvertsQuery) {
    return ResultWrapper.unwrap(
      await this.applicationService.getApplicationAdverts(query),
    )
  }

  /**
   * Retrieves the price of an application.
   * @param applicationId The ID of the application.
   * @returns A promise that resolves to the price of the application.
   */
  @UseGuards(ApplicationAuthGaurd)
  @WithCase(false)
  @Route({
    path: ':id/price',
    operationId: 'getPrice',
    params: [{ name: 'id', type: 'string', required: true }],
    responseType: CasePriceResponse,
  })
  async getPrice(
    @Param('id', new UUIDValidationPipe()) applicationId: string,
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
  @UseGuards(ApplicationAuthGaurd)
  @WithCase(false)
  @Route({
    path: ':id',
    operationId: 'getApplication',
    params: [{ name: 'id', type: 'string', required: true }],
    responseType: GetApplicationResponse,
  })
  async getApplication(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<GetApplicationResponse> {
    return ResultWrapper.unwrap(
      await this.applicationService.getApplication(id),
    )
  }

  /**
   * Handles submissions from the application system.
   * @param applicationId The ID of the application.
   * @returns A promise that resolves when the application is posted.
   */
  @UseGuards(ApplicationAuthGaurd)
  @WithCase(false)
  @Route({
    method: 'post',
    path: ':id/post',
    operationId: 'postApplication',
    params: [{ name: 'id', type: 'string', required: true }],
  })
  async postApplication(
    @Param('id', new UUIDValidationPipe()) applicationId: string,
  ) {
    return ResultWrapper.unwrap(
      await this.applicationService.postApplication(applicationId),
    )
  }

  /**
   * Retrieves the comments of an application.
   * @param applicationId The ID of the application.
   * @returns A promise that resolves to the comments of the application.
   */
  @UseGuards(ApplicationAuthGaurd)
  @WithCase(true)
  @Route({
    path: ':id/comments',
    operationId: 'getComments',
    params: [{ name: 'id', type: 'string', required: true }],
    responseType: GetComments,
  })
  async getComments(
    @Param('id', new UUIDValidationPipe()) applicationId: string,
    @CurrentUser() user: ApplicationUser,
  ): Promise<GetComments> {
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
  @UseGuards(ApplicationAuthGaurd)
  @WithCase(true)
  @Route({
    method: 'post',
    path: ':id/comments',
    operationId: 'postComment',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: PostApplicationComment,
  })
  async postComment(
    @Param('id', new UUIDValidationPipe()) applicationId: string,
    @Body() commentBody: PostApplicationComment,
    @CurrentUser() user: ApplicationUser,
  ): Promise<void> {
    ResultWrapper.unwrap(
      await this.applicationService.postComment(
        applicationId,
        commentBody,
        user,
      ),
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
    @Param('id', new UUIDValidationPipe()) applicationId: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: ONE_MEGA_BYTE * 20,
            message: `File size exceeds the limit of 20MB.`,
          }),
          new FileTypeValidationPipe({
            mimetype: ALLOWED_MIME_TYPES,
            maxNumberOfFiles: 10,
          }),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
  ): Promise<S3UploadFilesResponse> {
    this.logger.debug('Uploading attachments for application', {
      applicationId,
      files: files.map((file) => file.originalname),
    })

    return ResultWrapper.unwrap(
      await this.applicationService.uploadAttachments(applicationId, files),
    )
  }

  @UseGuards(ApplicationAuthGaurd)
  @WithCase(false)
  @Route({
    path: ':id/presigned-url/:type',
    method: 'post',
    operationId: 'getPresignedUrl',
    params: [
      { name: 'id', type: 'string', required: true },
      { name: 'type', enum: AttachmentTypeParam, required: true },
    ],
    bodyType: GetPresignedUrlBody,
    responseType: PresignedUrlResponse,
  })
  async getPresignedUrl(
    @Body() body: GetPresignedUrlBody,
    @Param('id', new UUIDValidationPipe()) applicationId: string,
    @Param('type', new EnumValidationPipe(AttachmentTypeParam))
    type: AttachmentTypeParam,
  ): Promise<PresignedUrlResponse> {
    const key = `applications/${applicationId}/${type}/${body.fileName}.${body.fileType}`

    return ResultWrapper.unwrap(
      await this.applicationService.getPresignedUrl(key),
    )
  }

  @UseGuards(ApplicationAuthGaurd)
  @WithCase(false)
  @Route({
    path: ':id/attachments/:type',
    method: 'post',
    operationId: 'addApplicationAttachment',
    params: [
      { name: 'id', type: String, required: true },
      { name: 'type', enum: AttachmentTypeParam, required: true },
    ],
    bodyType: PostApplicationAttachmentBody,
  })
  async addApplicationAttachment(
    @Param('id', new UUIDValidationPipe()) applicationId: string,
    @Param('type', new EnumValidationPipe(AttachmentTypeParam))
    type: AttachmentTypeParam,
    @Body() body: PostApplicationAttachmentBody,
  ) {
    ResultWrapper.unwrap(
      await this.applicationService.addApplicationAttachment(
        applicationId,
        type,
        body,
      ),
    )
  }

  @UseGuards(ApplicationAuthGaurd)
  @WithCase(false)
  @Route({
    path: ':id/attachments/:type',
    params: [
      { name: 'id', type: String, required: true },
      { name: 'type', enum: AttachmentTypeParam, required: true },
    ],
    operationId: 'getApplicationAttachments',
    responseType: GetApplicationAttachmentsResponse,
  })
  async getApplicationAttachments(
    @Param('id', new UUIDValidationPipe()) applicationId: string,
    @Param('type', new EnumValidationPipe(AttachmentTypeParam))
    type: AttachmentTypeParam,
  ) {
    return ResultWrapper.unwrap(
      await this.applicationService.getApplicationAttachments(
        applicationId,
        type,
      ),
    )
  }

  /**
   *
   * @param applicationId id of the application
   * @param key location of the attachment in s3
   */
  @UseGuards(ApplicationAuthGaurd)
  @WithCase(false)
  @Route({
    path: ':id/attachments/',
    method: 'delete',
    operationId: 'deleteApplicationAttachment',
    params: [{ name: 'id', type: String, required: true }],
    query: [{ name: 'key', type: String, required: true }],
  })
  async deleteApplicationAttachment(
    @Param('id', new UUIDValidationPipe()) applicationId: string,
    @Query('key', IsStringValidationPipe) key: string,
  ) {
    ResultWrapper.unwrap(
      await this.applicationService.deleteApplicationAttachment(
        applicationId,
        key,
      ),
    )
  }

  @UseGuards(ApplicationAuthGaurd)
  @WithCase(false)
  @Route({
    path: ':id/involved-parties',
    operationId: 'getInvolvedParties',
    params: [{ name: 'id', type: 'string', required: true }],
    responseType: ApplicationUserInvolvedPartiesResponse,
  })
  async getInvolvedParties(@CurrentUser() user: ApplicationUser) {
    return ResultWrapper.unwrap(
      await this.applicationUserService.getUserInvolvedParties(user.id),
    )
  }

  @UseGuards(ApplicationAuthGaurd)
  @WithCase(true)
  @Route({
    path: ':id/case',
    operationId: 'getApplicationCase',
    params: [{ name: 'id', type: 'string', required: true }],
    responseType: GetApplicationCaseResponse,
  })
  async getApplicationCase(
    @Param('id', new UUIDValidationPipe()) applicationId: string,
  ) {
    return ResultWrapper.unwrap(
      await this.applicationService.getApplicationCase(applicationId),
    )
  }

  @UseGuards(ApplicationAuthGaurd)
  @WithCase(false)
  @Route({
    path: 'advert/templates',
    method: 'get',
    operationId: 'getApplicationAdvertTemplates',
    responseType: [AdvertTemplateDetails],
  })
  async getApplicationAdvertTemplates() {
    return ResultWrapper.unwrap(
      await this.applicationService.getApplicationAdvertTemplates(),
    )
  }

  @UseGuards(ApplicationAuthGaurd)
  @WithCase(false)
  @Route({
    path: 'advert/templates/:advertType',
    method: 'get',
    operationId: 'getApplicationAdvertTemplate',
    params: [{ name: 'advertType', type: 'string', required: true }],
    responseType: GetAdvertTemplateResponse,
  })
  async getApplicationAdvertTemplate(
    @Param('advertType') advertType: AdvertTemplateTypeEnums,
  ) {
    return ResultWrapper.unwrap(
      await this.applicationService.getApplicationAdvertTemplate({
        type: advertType,
      }),
    )
  }

  @UseGuards(ApplicationAuthGaurd)
  @WithCase(false)
  @ApiResponse({
    status: 404,
    description: 'Signature not found',
  })
  @ApiResponse({
    status: 200,
    description: 'Successful signature get.',
    type: GetSignature,
  })
  @Route({
    path: '/involved-party/:involvedPartyId',
    method: 'get',
    operationId: 'getSignaturesForInvolvedParty',
    params: [{ name: 'involvedPartyId', type: 'string', required: true }],
    responseType: GetSignature,
  })
  async getSignaturesForInvolvedParty(
    @Param('involvedPartyId', new UUIDValidationPipe()) involvedPartyId: string,
  ) {
    const res = ResultWrapper.unwrap(
      await this.signatureService.getSignatureForInvolvedParty(involvedPartyId),
    )

    return res
  }
}
