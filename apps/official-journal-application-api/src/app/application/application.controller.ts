import {
  AdvertTemplateTypeEnums,
  ALLOWED_MIME_TYPES,
  AttachmentTypeParam,
  ONE_MEGA_BYTE,
  UserRoleEnum,
} from '@dmr.is/constants'
import { CurrentUser, Roles } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { UserDto } from '@dmr.is/official-journal/dto'
import {
  InvolvedPartyGuard,
  TokenJwtAuthGuard,
} from '@dmr.is/official-journal/guards'
import {
  GetApplicationAttachmentsResponse,
  GetApplicationCaseResponse,
  PostApplicationAttachmentBody,
} from '@dmr.is/official-journal/modules/attachment'
import { GetComments } from '@dmr.is/official-journal/modules/comment'
import {
  GetSignature,
  ISignatureService,
} from '@dmr.is/official-journal/modules/signature'
import {
  GetInvoledPartiesByUserResponse,
  IUserService,
  RoleGuard,
} from '@dmr.is/official-journal/modules/user'
import {
  EnumValidationPipe,
  FileTypeValidationPipe,
  IsStringValidationPipe,
  UUIDValidationPipe,
} from '@dmr.is/pipelines'
import {
  GetPresignedUrlBody,
  PresignedUrlResponse,
  S3UploadFilesResponse,
} from '@dmr.is/shared/modules/aws'
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

import { ApplicationPriceResponse } from './dto/application-price-response.dto'
import {
  AdvertTemplateDetails,
  GetAdvertTemplateResponse,
} from './dto/get-advert-template-response.dto'
import { GetApplicationAdvertsQuery } from './dto/get-application-advert.dto'
import { GetApplicationResponse } from './dto/get-application-response.dto'
import { PostApplicationComment } from './dto/post-application-comment.dto'
import { IOfficialJournalApplicationService } from './application.service.interface'

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
    @Inject(IOfficialJournalApplicationService)
    private readonly officialJournalApplicationService: IOfficialJournalApplicationService,

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
      await this.officialJournalApplicationService.getApplicationAdverts(query),
    )
  }

  @Get(':id/price')
  @ApiOperation({ operationId: 'getPrice' })
  @ApiResponse({ type: ApplicationPriceResponse })
  async getPrice(
    @Param('id', new UUIDValidationPipe()) applicationId: string,
  ): Promise<ApplicationPriceResponse> {
    return ResultWrapper.unwrap(
      await this.officialJournalApplicationService.getPrice(applicationId),
    )
  }

  @Post(':id/post')
  @ApiOperation({ operationId: 'postApplication' })
  @ApiResponse({ status: 200 })
  async postApplication(
    @Param('id', new UUIDValidationPipe()) applicationId: string,
  ) {
    return ResultWrapper.unwrap(
      await this.officialJournalApplicationService.postApplication(
        applicationId,
      ),
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
      await this.officialJournalApplicationService.getComments(applicationId),
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
      await this.officialJournalApplicationService.postComment(
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
      await this.officialJournalApplicationService.uploadAttachments(
        applicationId,
        files,
      ),
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
      await this.officialJournalApplicationService.getPresignedUrl(key),
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
      await this.officialJournalApplicationService.addApplicationAttachment(
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
      await this.officialJournalApplicationService.getApplicationAttachments(
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
      await this.officialJournalApplicationService.deleteApplicationAttachment(
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
      await this.officialJournalApplicationService.getApplicationCase(
        applicationId,
      ),
    )
  }

  @Get('advert/templates')
  @ApiOperation({ operationId: 'getApplicationAdvertTemplates' })
  @ApiResponse({ type: [AdvertTemplateDetails] })
  async getApplicationAdvertTemplates() {
    return ResultWrapper.unwrap(
      await this.officialJournalApplicationService.getApplicationAdvertTemplates(),
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
      await this.officialJournalApplicationService.getApplicationAdvertTemplate(
        {
          type: advertType,
        },
      ),
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
