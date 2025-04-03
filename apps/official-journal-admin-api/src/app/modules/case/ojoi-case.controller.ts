import { UserRoleEnum } from '@dmr.is/constants'
import { CurrentUser, Roles } from '@dmr.is/decorators'
import {
  ExternalCommentBodyDto,
  GetComment,
  GetComments,
  InternalCommentBodyDto,
} from '@dmr.is/official-journal/dto/comment/comment.dto'
import { UserDto } from '@dmr.is/official-journal/dto/user/user.dto'
import { TokenJwtAuthGuard } from '@dmr.is/official-journal/guards'
import { CaseStatusEnum, DepartmentEnum } from '@dmr.is/official-journal/models'
import {
  PostApplicationAssetBody,
  PostApplicationAttachmentBody,
} from '@dmr.is/official-journal/modules/attachment'
import { ICaseHistoryService } from '@dmr.is/official-journal/modules/case-history'
import { ICommentService } from '@dmr.is/official-journal/modules/comment'
import {
  IPriceService,
  TransactionFeeCodesResponse,
} from '@dmr.is/official-journal/modules/price'
import { RoleGuard } from '@dmr.is/official-journal/modules/user'
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

import { ICasePaymentService } from '../payment/payment.service.interface'
import {
  GetCasesWithDepartmentCount,
  GetCasesWithStatusCount,
} from './dto/case-with-counter.dto'
import {
  GetCasesWithDepartmentCountQuery,
  GetCasesWithStatusCountQuery,
} from './dto/get-cases-with-count-query.dto'
import {
  GetCasesWithPublicationNumber,
  GetCasesWithPublicationNumberQuery,
} from './dto/get-cases-with-publication-number.dto'
import { PostCasePublishBody } from './dto/post-publish-body.dto'
import {
  UpdateAdvertHtmlBody,
  UpdateAdvertHtmlCorrection,
} from './dto/update-advert-html-body.dto'
import { IOfficialJournalCaseService } from './ojoi-case.service.interface'

@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, RoleGuard)
@Roles(UserRoleEnum.Admin)
@Controller({
  version: '1',
  path: 'cases',
})
export class OfficialJournalCaseController {
  constructor(
    @Inject(IOfficialJournalCaseService)
    private readonly caseService: IOfficialJournalCaseService,

    @Inject(IPriceService)
    private readonly priceService: IPriceService,

    @Inject(ICommentService) private readonly commentService: ICommentService,
    @Inject(ICasePaymentService)
    private readonly paymentService: ICasePaymentService,
    @Inject(ICaseHistoryService)
    private readonly caseHistoryService: ICaseHistoryService,
  ) {}

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

  @Put(':id/status/next')
  @ApiOperation({ operationId: 'updateNextStatus' })
  @ApiNoContentResponse()
  async updateNextStatus(
    @Param('id', new UUIDValidationPipe()) id: string,
    @CurrentUser() user: UserDto,
  ) {
    const updateResults = await this.caseService.updateCaseNextStatus(id, user)

    // TODO: check if the status ready for publishing then do this
    // await this.paymentService.postExternalPaymentByCaseId(id)
    if (!updateResults.result.ok) {
      throw new HttpException(
        updateResults.result.error.message,
        updateResults.result.error.code,
      )
    }

    this.caseHistoryService.createCaseHistory(id)
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

    this.caseHistoryService.createCaseHistory(id)
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

    this.caseHistoryService.createCaseHistory(id)
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
    //TODO: Fix
    // const communicationStatusUpdateResult =
    //   await this.caseService.updateCaseCommunicationStatusByStatus(
    //     id,
    //     CaseCommunicationStatusEnum.WaitingForAnswers,
    //   )

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
