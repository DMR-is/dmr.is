import { UserRoleEnum } from '@dmr.is/constants'
import { CurrentUser, Roles } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { TokenJwtAuthGuard } from '@dmr.is/official-journal/guards'
import {
  CaseCommunicationStatusEnum,
  CaseStatusEnum,
  DepartmentEnum,
} from '@dmr.is/official-journal/models'
import {
  PostApplicationAssetBody,
  PostApplicationAttachmentBody,
} from '@dmr.is/official-journal/modules/attachment'
import {
  ExternalCommentBodyDto,
  GetComment,
  GetComments,
  ICommentService,
  InternalCommentBodyDto,
} from '@dmr.is/official-journal/modules/comment'
import {
  GetPaymentResponse,
  IPriceService,
  TransactionFeeCodesResponse,
} from '@dmr.is/official-journal/modules/price'
import { RoleGuard, UserDto } from '@dmr.is/official-journal/modules/user'
import { EnumValidationPipe, UUIDValidationPipe } from '@dmr.is/pipelines'
import { PresignedUrlResponse } from '@dmr.is/shared/modules/aws'
import { ResultWrapper } from '@dmr.is/types'

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger'

import { AddCaseAdvertCorrection } from './dto/add-case-advert-correction.dto'
import {
  GetCasesWithDepartmentCount,
  GetCasesWithStatusCount,
} from './dto/case.dto'
import { CaseChannel } from './dto/case-channel.dto'
import { CreateCaseDto, CreateCaseResponseDto } from './dto/create-case.dto'
import { CreateCaseChannelBody } from './dto/create-case-channel-body.dto'
import { GetCaseResponse } from './dto/get-case-response.dto'
import { GetCasesQuery } from './dto/get-cases-query.dto'
import { GetCasesReponse } from './dto/get-cases-response.dto'
import {
  GetCasesWithDepartmentCountQuery,
  GetCasesWithStatusCountQuery,
} from './dto/get-cases-with-count-query.dto'
import {
  GetCasesWithPublicationNumber,
  GetCasesWithPublicationNumberQuery,
} from './dto/get-cases-with-publication-number.dto'
import { GetCommunicationSatusesResponse } from './dto/get-communication-satuses-response.dto'
import { GetNextPublicationNumberResponse } from './dto/get-next-publication-number-response.dto'
import { GetTagsResponse } from './dto/get-tags-response.dto'
import { PostCasePublishBody } from './dto/post-publish-body.dto'
import {
  UpdateAdvertHtmlBody,
  UpdateAdvertHtmlCorrection,
} from './dto/update-advert-html-body.dto'
import { UpdateCaseStatusBody } from './dto/update-case-status-body.dto'
import { UpdateCategoriesBody } from './dto/update-category-body.dto'
import { UpdateCommunicationStatusBody } from './dto/update-communication-status.dto'
import { UpdateCaseDepartmentBody } from './dto/update-department-body.dto'
import { UpdateFasttrackBody } from './dto/update-fasttrack-body.dto'
import { UpdateCasePriceBody } from './dto/update-price-body.dto'
import { UpdatePublishDateBody } from './dto/update-publish-date-body.dto'
import { UpdateTagBody } from './dto/update-tag-body.dto'
import { UpdateTitleBody } from './dto/update-title-body.dto'
import { UpdateCaseTypeBody } from './dto/update-type-body.dto'
import { ICaseService } from './case.service.interface'

const LOG_CATEGORY = 'case-controller'

@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, RoleGuard)
@Roles(UserRoleEnum.Admin)
@Controller({
  version: '1',
  path: 'cases',
})
export class CaseController {
  constructor(
    @Inject(ICaseService)
    private readonly caseService: ICaseService,

    @Inject(IPriceService)
    private readonly priceService: IPriceService,

    @Inject(ICommentService) private readonly commentService: ICommentService,
    @Inject(LOGGER_PROVIDER)
    private readonly logger: Logger,
  ) {}

  @Post(':caseId/communication-channels')
  @ApiOperation({ operationId: 'createCommunicationChannel' })
  @ApiResponse({ status: 200, type: CaseChannel })
  async createCommunicationChannel(
    @Param('caseId', new UUIDValidationPipe()) caseId: string,
    @Body() body: CreateCaseChannelBody,
  ) {
    return this.caseService.createCaseChannel(caseId, body)
  }

  @Delete(':caseId/communication-channels/:channelId')
  @ApiOperation({ operationId: 'deleteCommunicationChannel' })
  @ApiNoContentResponse()
  async deleteCommunicationChannel(
    @Param('caseId', new UUIDValidationPipe()) caseId: string,
    @Param('channelId', new UUIDValidationPipe()) channelId: string,
  ) {
    ResultWrapper.unwrap(
      await this.caseService.deleteCaseChannel(caseId, channelId),
    )
  }

  @Get('nextPublicationNumber/:departmentId')
  @ApiOperation({ operationId: 'getNextPublicationNumber' })
  @ApiResponse({ status: 200, type: GetNextPublicationNumberResponse })
  async getNextPublicationNumber(
    @Param('departmentId', new UUIDValidationPipe()) departmentId: string,
  ): Promise<GetNextPublicationNumberResponse> {
    return ResultWrapper.unwrap(
      await this.caseService.getNextCasePublicationNumber(departmentId),
    )
  }

  @Get('communicationStatuses')
  @ApiOperation({ operationId: 'getCommunicationStatuses' })
  @ApiResponse({ status: 200, type: GetCommunicationSatusesResponse })
  async communicationStatues(): Promise<GetCommunicationSatusesResponse> {
    return ResultWrapper.unwrap(
      await this.caseService.getCommunicationStatuses(),
    )
  }

  @Get('tags')
  @ApiOperation({ operationId: 'getTags' })
  @ApiResponse({ status: 200, type: GetTagsResponse })
  async tags(): Promise<GetTagsResponse> {
    return ResultWrapper.unwrap(await this.caseService.getCaseTags())
  }

  @Get('feeCodes')
  @ApiOperation({ operationId: 'getFeeCodes' })
  @ApiResponse({ status: 200, type: TransactionFeeCodesResponse })
  async feeCodes(): Promise<TransactionFeeCodesResponse> {
    return ResultWrapper.unwrap(await this.priceService.getAllFeeCodes())
  }

  @Get('/status-count/:status')
  @ApiOperation({ operationId: 'getCasesWithStatusCount' })
  @ApiParam({
    name: 'status',
    enum: CaseStatusEnum,
    enumName: 'CaseStatusEnum',
  })
  @ApiResponse({ status: 200, type: GetCasesWithStatusCount })
  async getCasesWithStatusCount(
    @Param('status', new EnumValidationPipe(CaseStatusEnum))
    status: CaseStatusEnum,
    @Query() params?: GetCasesWithStatusCountQuery,
  ): Promise<GetCasesWithStatusCount> {
    return ResultWrapper.unwrap(
      await this.caseService.getCasesWithStatusCount(status, params),
    )
  }

  @Get(':caseId/attachments/:attachmentId')
  @ApiOperation({ operationId: 'getCaseAttachment' })
  @ApiResponse({ status: 200, type: PresignedUrlResponse })
  async getCaseAttachment(
    @Param('caseId', new UUIDValidationPipe()) caseId: string,
    @Param('attachmentId', new UUIDValidationPipe()) attachmentId: string,
  ): Promise<PresignedUrlResponse> {
    return ResultWrapper.unwrap(
      await this.caseService.getCaseAttachment(caseId, attachmentId),
    )
  }

  @Put(':caseId/attachments/:attachmentId')
  @ApiOperation({ operationId: 'overwriteCaseAttachment' })
  @ApiResponse({ status: 200, type: PresignedUrlResponse })
  async overwriteCaseAttachment(
    @Param('caseId', new UUIDValidationPipe()) caseId: string,
    @Param('attachmentId', new UUIDValidationPipe()) attachmentId: string,
    @Body() body: PostApplicationAttachmentBody,
  ): Promise<PresignedUrlResponse> {
    return (
      await this.caseService.overwriteCaseAttachment(caseId, attachmentId, body)
    ).unwrap()
  }

  @Put(':id/price')
  @ApiOperation({ operationId: 'updatePrice' })
  @ApiNoContentResponse()
  async updatePrice(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateCasePriceBody,
  ) {
    ResultWrapper.unwrap(await this.caseService.updateCasePrice(id, body))
  }

  @Get(':id/price/payment-status')
  @ApiOperation({ operationId: 'getCasePaymentStatus' })
  @ApiResponse({ status: 200, type: GetPaymentResponse })
  async getCasePaymentStatus(
    @Param('id', new UUIDValidationPipe()) caseId: string,
  ): Promise<GetPaymentResponse> {
    return ResultWrapper.unwrap(
      await this.caseService.getCasePaymentStatus({
        chargeBase: caseId,
        debtorNationalId: caseId, // TODO: FIX this
      }),
    )
  }

  @Put(':id/fasttrack')
  @ApiOperation({ operationId: 'updateFasttrack' })
  @ApiNoContentResponse()
  async updateFasttrack(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateFasttrackBody,
  ) {
    ResultWrapper.unwrap(await this.caseService.updateCaseFasttrack(id, body))
  }

  @Put(':id/tag')
  @ApiOperation({ operationId: 'updateTag' })
  @ApiNoContentResponse()
  async updateTag(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateTagBody,
  ) {
    ResultWrapper.unwrap(await this.caseService.updateCaseTag(id, body))
  }

  @Put(':id/department')
  @ApiOperation({ operationId: 'updateDepartment' })
  @ApiNoContentResponse()
  async updateDepartment(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateCaseDepartmentBody,
  ) {
    ResultWrapper.unwrap(await this.caseService.updateCaseDepartment(id, body))
  }

  @Put(':id/type')
  @ApiOperation({ operationId: 'updateCaseType' })
  @ApiNoContentResponse()
  async updateType(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateCaseTypeBody,
  ) {
    ResultWrapper.unwrap(await this.caseService.updateCaseType(id, body))
  }

  @Put(':id/communicationStatus')
  @ApiOperation({ operationId: 'updateCommunicationStatus' })
  @ApiNoContentResponse()
  async updateCommunicationStatus(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateCommunicationStatusBody,
  ) {
    ResultWrapper.unwrap(
      await this.caseService.updateCaseCommunicationStatus(id, body),
    )
  }

  @Put(':id/publishDate')
  @ApiOperation({ operationId: 'updatePublishDate' })
  @ApiNoContentResponse()
  async updatePublishDate(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdatePublishDateBody,
  ) {
    ResultWrapper.unwrap(
      await this.caseService.updateCaseRequestedPublishDate(id, body),
    )
  }

  @Put(':id/title')
  @ApiOperation({ operationId: 'updateTitle' })
  @ApiNoContentResponse()
  async updateTitle(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateTitleBody,
  ) {
    ResultWrapper.unwrap(await this.caseService.updateCaseTitle(id, body))
  }

  @Post(':id/correction')
  @ApiOperation({ operationId: 'postCorrection' })
  @ApiNoContentResponse()
  async postCorrection(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: AddCaseAdvertCorrection,
  ) {
    ResultWrapper.unwrap(await this.caseService.postCaseCorrection(id, body))
  }

  @Put(':id/categories')
  @ApiOperation({ operationId: 'updateCategories' })
  @ApiNoContentResponse()
  async updateCategories(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateCategoriesBody,
  ) {
    ResultWrapper.unwrap(await this.caseService.updateCaseCategories(id, body))
  }

  @Put(':id/status/next')
  @ApiOperation({ operationId: 'updateNextStatus' })
  @ApiNoContentResponse()
  async updateNextStatus(
    @Param('id', new UUIDValidationPipe()) id: string,
    @CurrentUser() user: UserDto,
  ) {
    const updateResults = await this.caseService.updateCaseNextStatus(id, user)

    if (!updateResults.result.ok) {
      throw new HttpException(
        updateResults.result.error.message,
        updateResults.result.error.code,
      )
    }

    const historyResults = await this.caseService.createCaseHistory(id)

    if (!historyResults.result.ok) {
      this.logger.warn('Failed to create case history', {
        caseId: id,
        error: historyResults.result.error,
        category: LOG_CATEGORY,
        context: 'CaseController',
      })
    }
  }

  @Put(':id/status/previous')
  @ApiOperation({ operationId: 'updatePreviousStatus' })
  @ApiNoContentResponse()
  async updatePreviousStatus(
    @Param('id', new UUIDValidationPipe()) id: string,
    @CurrentUser() user: UserDto,
  ) {
    const updateResults = await this.caseService.updateCasePreviousStatus(
      id,
      user,
    )

    if (!updateResults.result.ok) {
      throw new HttpException(
        updateResults.result.error.message,
        updateResults.result.error.code,
      )
    }

    const historyResults = await this.caseService.createCaseHistory(id)

    if (!historyResults.result.ok) {
      this.logger.warn('Failed to create case history', {
        caseId: id,
        error: historyResults.result.error,
        category: LOG_CATEGORY,
        context: 'CaseController',
      })
    }
  }

  @Put(':id/assign/:userId')
  @ApiOperation({ operationId: 'assignEmployee' })
  @ApiNoContentResponse()
  async assign(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Param('userId', new UUIDValidationPipe()) userId: string,
    @CurrentUser() user: UserDto,
  ) {
    ResultWrapper.unwrap(
      await this.caseService.updateEmployee(id, userId, user),
    )
  }

  @Put(':id/status')
  @ApiOperation({ operationId: 'updateCaseStatus' })
  @ApiNoContentResponse()
  async updateStatus(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateCaseStatusBody,
    @CurrentUser() user: UserDto,
  ) {
    const updateResults = await this.caseService.updateCaseStatus(
      id,
      body,
      user,
    )

    if (!updateResults.result.ok) {
      throw new HttpException(
        updateResults.result.error.message,
        updateResults.result.error.code,
      )
    }

    const historyResults = await this.caseService.createCaseHistory(id)

    if (!historyResults.result.ok) {
      this.logger.warn('Failed to create case history', {
        caseId: id,
        error: historyResults.result.error,
        category: LOG_CATEGORY,
        context: 'CaseController',
      })
    }

    return
  }

  @Put(':id/update')
  @ApiOperation({ operationId: 'updateCaseAndAddCorrection' })
  @ApiNoContentResponse()
  async updateAdvertHtmlCorrection(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateAdvertHtmlCorrection,
  ) {
    ResultWrapper.unwrap(await this.caseService.updateAdvert(id, body))
  }

  @Put(':id/html')
  @ApiOperation({ operationId: 'updateAdvertHtml' })
  @ApiNoContentResponse()
  async updateAdvertHtml(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateAdvertHtmlBody,
  ) {
    const updatedHtmlResult = await this.caseService.updateAdvertByHtml(
      id,
      body,
    )

    if (!updatedHtmlResult.result.ok) {
      throw new HttpException(
        updatedHtmlResult.result.error.message,
        updatedHtmlResult.result.error.code,
      )
    }

    const historyResults = await this.caseService.createCaseHistory(id)

    if (!historyResults.result.ok) {
      this.logger.warn('Failed to create case history', {
        caseId: id,
        error: historyResults.result.error,
        category: LOG_CATEGORY,
        context: 'CaseController',
      })
    }

    return
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getCase' })
  @ApiResponse({ status: 200, type: GetCaseResponse })
  async getCase(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<GetCaseResponse> {
    return ResultWrapper.unwrap(await this.caseService.getCase(id))
  }

  @Post()
  @ApiOperation({ operationId: 'createCase' })
  @ApiResponse({ status: 200, type: CreateCaseResponseDto })
  async createCase(
    @CurrentUser() currentUser: UserDto,
    @Body() body: CreateCaseDto,
  ) {
    return ResultWrapper.unwrap(
      await this.caseService.createCase(currentUser, body),
    )
  }

  @Get()
  @ApiOperation({ operationId: 'getCases' })
  @ApiResponse({ status: 200, type: GetCasesReponse })
  async getCases(@Query() params?: GetCasesQuery): Promise<GetCasesReponse> {
    return ResultWrapper.unwrap(await this.caseService.getCases(params))
  }

  @Get('/department-count/:department')
  @ApiOperation({ operationId: 'getCasesWithDepartmentCount' })
  @ApiParam({
    name: 'department',
    enum: DepartmentEnum,
    enumName: 'DepartmentEnum',
  })
  @ApiResponse({ status: 200, type: GetCasesWithDepartmentCount })
  async getCasesWithDepartmentCount(
    @Param('department', new EnumValidationPipe(DepartmentEnum))
    department: DepartmentEnum,
    @Query() query?: GetCasesWithDepartmentCountQuery,
  ): Promise<GetCasesWithDepartmentCount> {
    return ResultWrapper.unwrap(
      await this.caseService.getCasesWithDepartmentCount(department, query),
    )
  }

  @Post('publish')
  @ApiOperation({ operationId: 'publish' })
  @ApiNoContentResponse()
  async publish(@Body() body: PostCasePublishBody) {
    ResultWrapper.unwrap(await this.caseService.publishCases(body))
  }

  @Post(':id/reject')
  @ApiOperation({ operationId: 'rejectCase' })
  @ApiNoContentResponse()
  async reject(@Param('id', new UUIDValidationPipe()) id: string) {
    ResultWrapper.unwrap(await this.caseService.rejectCase(id))
  }

  @Get(':id/comments/v2')
  @ApiOperation({ operationId: 'getComments' })
  @ApiResponse({ status: 200, type: GetComments })
  async getComments(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<GetComments> {
    return ResultWrapper.unwrap(await this.commentService.getComments(id))
  }

  @Post(':id/comments/v2/internal')
  @ApiOperation({ operationId: 'createInternalComment' })
  @ApiResponse({ status: 200, type: GetComment })
  async createCommentInternal(
    @Param('id', new UUIDValidationPipe()) id: string,
    @CurrentUser() user: UserDto,
    @Body() body: InternalCommentBodyDto,
  ): Promise<GetComment> {
    return ResultWrapper.unwrap(
      await this.commentService.createInternalComment(id, {
        adminUserCreatorId: user.id,
        comment: body.comment,
      }),
    )
  }

  @Post(':id/comments/v2/external')
  @ApiOperation({ operationId: 'createExternalComment' })
  @ApiResponse({ status: 200, type: GetComment })
  async createCommentExternal(
    @Param('id', new UUIDValidationPipe()) id: string,
    @CurrentUser() user: UserDto,
    @Body() body: ExternalCommentBodyDto,
  ): Promise<GetComment> {
    const communicationStatusUpdateResult =
      await this.caseService.updateCaseCommunicationStatusByStatus(
        id,
        CaseCommunicationStatusEnum.WaitingForAnswers,
      )

    if (!communicationStatusUpdateResult.result.ok) {
      this.logger.warn(
        'Failed to update communication status when creating external comment',
        {
          caseId: id,
          error: communicationStatusUpdateResult.result.error,
          category: LOG_CATEGORY,
          context: 'CaseController',
        },
      )
    }

    return ResultWrapper.unwrap(
      await this.commentService.createExternalComment(id, {
        adminUserCreatorId: user.id,
        comment: body.comment,
      }),
    )
  }

  @Delete(':id/comments/:commentId')
  @ApiOperation({ operationId: 'deleteComment' })
  @ApiNoContentResponse()
  async deleteComment(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Param('commentId', new UUIDValidationPipe()) commentId: string,
  ) {
    ResultWrapper.unwrap(await this.commentService.deleteComment(id, commentId))
  }

  @Get('/with-publication-number/:department')
  @ApiOperation({ operationId: 'getCasesWithPublicationNumber' })
  @ApiParam({
    name: 'department',
    enum: DepartmentEnum,
    enumName: 'DepartmentEnum',
  })
  @ApiResponse({ status: 200, type: GetCasesWithPublicationNumber })
  async getCasesWithPublicationNumber(
    @Param('department', new EnumValidationPipe(DepartmentEnum))
    department: DepartmentEnum,
    @Query()
    params: GetCasesWithPublicationNumberQuery,
  ): Promise<GetCasesWithPublicationNumber> {
    return ResultWrapper.unwrap(
      await this.caseService.getCasesWithPublicationNumber(department, params),
    )
  }

  @Post(':caseId/upload-assets')
  @ApiOperation({ operationId: 'uploadApplicationAttachment' })
  @ApiResponse({ status: 200, type: PresignedUrlResponse })
  async uploadApplicationAttachment(
    @Param('caseId', new UUIDValidationPipe()) caseId: string,
    @Body() body: PostApplicationAssetBody,
  ): Promise<PresignedUrlResponse> {
    return (await this.caseService.uploadAttachments(body.key)).unwrap()
  }
}
