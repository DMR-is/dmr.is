import {
  ALLOWED_MIME_TYPES,
  AttachmentTypeParam,
  ONE_MEGA_BYTE,
  UserRoleEnum,
} from '@dmr.is/constants'
import { CurrentUser, Roles } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  IApplicationService,
  InvolvedPartyGuard,
  ISignatureService,
  IUserService,
  RoleGuard,
  TokenJwtAuthGuard,
} from '@dmr.is/modules'
import {
  EnumValidationPipe,
  FileTypeValidationPipe,
  IsStringValidationPipe,
  UUIDValidationPipe,
} from '@dmr.is/pipelines'
import {
  AdvertTemplateDetails,
  AdvertTemplateTypeEnums,
  CasePriceResponse,
  GetAdvertTemplateResponse,
  GetApplicationAdvertsQuery,
  GetApplicationAttachmentsResponse,
  GetApplicationCaseResponse,
  GetApplicationPriceQuery,
  GetApplicationResponse,
  GetComments,
  GetInvoledPartiesByUserResponse,
  GetPresignedUrlBody,
  GetSignature,
  PostApplicationAttachmentBody,
  PostApplicationComment,
  PresignedUrlResponse,
  S3UploadFilesResponse,
  UserDto,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import {
  Body,
  Controller,
  Delete,
  Get,
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
import { FilesInterceptor } from '@nestjs/platform-express'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger'

import 'multer'

@Controller({
  path: 'applications',
  version: '1',
})
@UseGuards(TokenJwtAuthGuard, RoleGuard)
@ApiBearerAuth()
@Roles(UserRoleEnum.Admin, UserRoleEnum.Editor, UserRoleEnum.User)
export class ApplicationController {
  constructor(
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,

    @Inject(ISignatureService)
    private readonly signatureService: ISignatureService,

    @Inject(IUserService)
    private readonly userService: IUserService,

    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  @Get('/adverts')
  @ApiOperation({ operationId: 'getAdvertCopies' })
  @ApiResponse({ type: GetApplicationResponse })
  async getAdvertCopies(@Query() query: GetApplicationAdvertsQuery) {
    return ResultWrapper.unwrap(
      await this.applicationService.getApplicationAdverts(query),
    )
  }

  @Get(':id/price')
  @ApiOperation({ operationId: 'getPrice' })
  @ApiResponse({ type: CasePriceResponse })
  async getPrice(
    @Param('id', new UUIDValidationPipe()) applicationId: string,
    @Query() query: GetApplicationPriceQuery,
  ): Promise<CasePriceResponse> {
    return ResultWrapper.unwrap(
      await this.applicationService.getPrice(applicationId, query.feeCodes),
    )
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getApplication' })
  @ApiResponse({ type: GetApplicationResponse })
  async getApplication(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<GetApplicationResponse> {
    return ResultWrapper.unwrap(
      await this.applicationService.getApplication(id),
    )
  }

  @Post(':id/post')
  @ApiOperation({ operationId: 'postApplication' })
  @ApiResponse({ status: 200 })
  async postApplication(
    @Param('id', new UUIDValidationPipe()) applicationId: string,
  ) {
    return ResultWrapper.unwrap(
      await this.applicationService.postApplication(applicationId),
    )
  }

  @Get(':id/comments')
  @ApiOperation({ operationId: 'getComments' })
  @ApiResponse({ status: 200, type: GetComments })
  @UseGuards(InvolvedPartyGuard)
  async getComments(
    @Param('id', new UUIDValidationPipe()) applicationId: string,
  ): Promise<GetComments> {
    return ResultWrapper.unwrap(
      await this.applicationService.getComments(applicationId),
    )
  }

  @Post(':id/comments')
  @ApiOperation({ operationId: 'postComment' })
  @ApiNoContentResponse()
  @UseGuards(InvolvedPartyGuard)
  async postComment(
    @Param('id', new UUIDValidationPipe()) applicationId: string,
    @Body() commentBody: PostApplicationComment,
    @CurrentUser() user: UserDto,
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
  @ApiOperation({ operationId: 'uploadApplicationAttachment' })
  @ApiConsumes('multipart/form-data')
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
  @ApiResponse({ status: 200, type: S3UploadFilesResponse })
  @UseInterceptors(FilesInterceptor('files'))
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

  @Post(':id/presigned-url/:type')
  @ApiOperation({ operationId: 'getPresignedUrl' })
  @ApiParam({ name: 'type', enum: AttachmentTypeParam })
  @ApiResponse({ type: PresignedUrlResponse })
  async getPresignedUrl(
    @Body() body: GetPresignedUrlBody,
    @Param('id', new UUIDValidationPipe()) applicationId: string,
    @Param('type', new EnumValidationPipe(AttachmentTypeParam))
    type: AttachmentTypeParam,
  ): Promise<PresignedUrlResponse> {
    let key = `applications/${applicationId}/${type}/${body.fileName}.${body.fileType}`
    if (type === AttachmentTypeParam.Assets) {
      key = `${type}/${applicationId}/${body.fileName}.${body.fileType}`
    }

    return ResultWrapper.unwrap(
      await this.applicationService.getPresignedUrl(key),
    )
  }

  @Post(':id/attachments/:type')
  @ApiOperation({ operationId: 'addApplicationAttachment' })
  @ApiParam({ name: 'type', enum: AttachmentTypeParam })
  @ApiNoContentResponse()
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

  @Get(':id/attachments/:type')
  @ApiOperation({ operationId: 'getApplicationAttachments' })
  @ApiParam({ name: 'type', enum: AttachmentTypeParam })
  @ApiResponse({ type: GetApplicationAttachmentsResponse })
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

  @Delete(':id/attachments/delete')
  @ApiOperation({ operationId: 'deleteApplicationAttachment' })
  @ApiNoContentResponse()
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

  @Get(':id/involved-parties')
  @ApiOperation({ operationId: 'getInvolvedParties' })
  @ApiResponse({ type: GetInvoledPartiesByUserResponse })
  async getInvolvedParties(@CurrentUser() user: UserDto) {
    return ResultWrapper.unwrap(
      await this.userService.getInvolvedPartiesByUser(user),
    )
  }

  @Get(':id/case')
  @ApiOperation({ operationId: 'getApplicationCase' })
  @ApiResponse({ type: GetApplicationCaseResponse })
  @UseGuards(InvolvedPartyGuard)
  async getApplicationCase(
    @Param('id', new UUIDValidationPipe()) applicationId: string,
  ) {
    return ResultWrapper.unwrap(
      await this.applicationService.getApplicationCase(applicationId),
    )
  }

  @Get('advert/templates')
  @ApiOperation({ operationId: 'getApplicationAdvertTemplates' })
  @ApiResponse({ type: [AdvertTemplateDetails] })
  async getApplicationAdvertTemplates() {
    return ResultWrapper.unwrap(
      await this.applicationService.getApplicationAdvertTemplates(),
    )
  }

  @Get('advert/templates/:advertType')
  @ApiOperation({ operationId: 'getApplicationAdvertTemplate' })
  @ApiParam({ name: 'advertType', enum: AdvertTemplateTypeEnums })
  @ApiResponse({ type: GetAdvertTemplateResponse })
  async getApplicationAdvertTemplate(
    @Param('advertType') advertType: AdvertTemplateTypeEnums,
  ) {
    return ResultWrapper.unwrap(
      await this.applicationService.getApplicationAdvertTemplate({
        type: advertType,
      }),
    )
  }

  @Get('involved-party/:involvedPartyId')
  @ApiOperation({ operationId: 'getSignaturesForInvolvedParty' })
  @ApiResponse({ status: 200, type: GetSignature })
  @ApiResponse({ status: 404 })
  async getSignaturesForInvolvedParty(
    @Param('involvedPartyId', new UUIDValidationPipe()) involvedPartyId: string,
  ) {
    const res = ResultWrapper.unwrap(
      await this.signatureService.getSignatureForInvolvedParty(involvedPartyId),
    )

    return res
  }
}
