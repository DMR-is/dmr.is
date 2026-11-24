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

import {
  ALLOWED_MIME_TYPES,
  AttachmentTypeParam,
  ONE_MEGA_BYTE,
  UserRoleEnum,
} from '@dmr.is/constants'
import { CurrentUser, Roles } from '@dmr.is/decorators'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  ApplicationCaller,
  ApplicationOwnershipGuard,
  CurrentApplication,
  IApplicationService,
  InvolvedPartyGuard,
  involvedPartyIdsOf,
  ISignatureService,
  IUserService,
  OwnInvolvedPartyGuard,
} from '@dmr.is/ojoi-modules'
import {
  EnumValidationPipe,
  FileTypeValidationPipe,
  IsStringValidationPipe,
  UUIDValidationPipe,
} from '@dmr.is/pipelines'
import {
  AdvertTemplateDetails,
  AdvertTemplateTypeEnums,
  Application,
  CasePriceResponse,
  GetAdvertTemplateResponse,
  GetApplicationAdvertsQuery,
  GetApplicationAttachmentsResponse,
  GetApplicationCaseResponse,
  GetApplicationResponse,
  GetComments,
  GetInvoledPartiesByUserResponse,
  GetInvolvedPartiesForApplicationQuery,
  GetMyUserInfoResponse,
  GetPresignedUrlBody,
  GetSignature,
  PostApplicationAttachmentBody,
  PostApplicationComment,
  PresignedUrlResponse,
  S3UploadFilesResponse,
  UserDto,
} from '@dmr.is/shared-dto'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'
import { ResultWrapper } from '@dmr.is/types'

import { ApplicationGuard } from '../guards/application.guard'

import 'multer'

const callerOf = (
  user: UserDto & Pick<DMRUser, 'actor'>,
): ApplicationCaller => ({
  nationalId: user.nationalId,
  actorNationalId: user.actor?.nationalId,
  involvedPartyIds: involvedPartyIdsOf(user.involvedParties),
  isAdmin: user.role?.title === UserRoleEnum.Admin,
})

@Controller({
  path: 'applications',
  version: '1',
})
@UseGuards(TokenJwtAuthGuard, ApplicationGuard)
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

  @Get('/my-user-info')
  @ApiOperation({ operationId: 'getMyUserInfo' })
  @ApiResponse({ type: GetMyUserInfoResponse })
  async getMyUserInfo(@CurrentUser() user: UserDto) {
    return ResultWrapper.unwrap(await this.userService.getMyUserInfo(user))
  }

  @Get(':id/price')
  @UseGuards(ApplicationOwnershipGuard)
  @ApiOperation({ operationId: 'getPrice' })
  @ApiResponse({ type: CasePriceResponse })
  async getPrice(
    @CurrentApplication() application: Application,
  ): Promise<CasePriceResponse> {
    return ResultWrapper.unwrap(
      await this.applicationService.getPrice(application),
    )
  }

  @Get(':id')
  @UseGuards(ApplicationOwnershipGuard)
  @ApiOperation({ operationId: 'getApplication' })
  @ApiResponse({ type: GetApplicationResponse })
  getApplication(
    @CurrentApplication() application: Application,
  ): GetApplicationResponse {
    return { application }
  }

  @Post(':id/post')
  @UseGuards(ApplicationOwnershipGuard)
  @ApiOperation({ operationId: 'postApplication' })
  @ApiResponse({ status: 200 })
  async postApplication(
    @CurrentApplication() application: Application,
    @CurrentUser() user: UserDto,
  ) {
    return ResultWrapper.unwrap(
      await this.applicationService.postApplication(
        application,
        callerOf(user),
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
  @UseGuards(ApplicationOwnershipGuard)
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
  @UseGuards(ApplicationOwnershipGuard)
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
  @UseGuards(ApplicationOwnershipGuard)
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
  @UseGuards(ApplicationOwnershipGuard)
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
  @UseGuards(ApplicationOwnershipGuard)
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
  async getInvolvedParties(
    @Param('id', new UUIDValidationPipe()) _id: string,
    @CurrentUser() user: UserDto,
    @Query() params?: GetInvolvedPartiesForApplicationQuery,
  ) {
    if (user.role.title === UserRoleEnum.InvolvedParty) {
      return {
        involvedParties: user.involvedParties,
      }
    }

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
  @UseGuards(OwnInvolvedPartyGuard)
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
