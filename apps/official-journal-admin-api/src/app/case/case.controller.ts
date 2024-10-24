import { USER_ROLES } from '@dmr.is/constants'
import { Roles, Route } from '@dmr.is/decorators'
import {
  AdminAuthGuard,
  IAdminUserService,
  ICaseService,
  ICommentService,
  IJournalService,
} from '@dmr.is/modules'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import {
  AdminUser,
  CaseCommentSourceEnum,
  CaseCommentTypeTitleEnum,
  CaseCommunicationStatus,
  CaseStatusEnum,
  CreateCaseResponse,
  DefaultSearchParams,
  EditorialOverviewResponse,
  GetAdvertTypesQueryParams,
  GetAdvertTypesResponse,
  GetCaseCommentResponse,
  GetCaseCommentsQuery,
  GetCaseCommentsResponse,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  GetCategoriesResponse,
  GetCommunicationSatusesResponse,
  GetDepartmentsResponse,
  GetNextPublicationNumberResponse,
  GetPublishedCasesQuery as GetFinishedCasesQuery,
  GetPublishedCasesResponse,
  GetTagsResponse,
  PostApplicationAttachmentBody,
  PostApplicationBody,
  PostCaseCommentBody,
  PostCasePublishBody,
  PresignedUrlResponse,
  UpdateAdvertHtmlBody,
  UpdateCaseDepartmentBody,
  UpdateCasePriceBody,
  UpdateCaseStatusBody,
  UpdateCaseTypeBody,
  UpdateCategoriesBody,
  UpdateCommunicationStatusBody,
  UpdateNextStatusBody,
  UpdatePaidBody,
  UpdatePublishDateBody,
  UpdateTagBody,
  UpdateTitleBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import {
  Body,
  Controller,
  Inject,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'

@Controller({
  version: '1',
  path: 'cases',
})
export class CaseController {
  constructor(
    @Inject(ICaseService)
    private readonly caseService: ICaseService,

    @Inject(IJournalService)
    private readonly journalService: IJournalService,

    @Inject(ICommentService)
    private readonly commentService: ICommentService,

    @Inject(IAdminUserService)
    private readonly adminAuthService: IAdminUserService,
  ) {}

  @Route({
    path: 'user/:nationalId',
    operationId: 'getUser',
    summary: 'Return a user for national id',
    responseType: AdminUser,
    params: [{ name: 'nationalId', type: 'string', required: true }],
  })
  async getUser(@Param('nationalId') nationalId: string) {
    return ResultWrapper.unwrap(
      await this.adminAuthService.getUserByNationalId(nationalId),
    ).user
  }

  @Route({
    path: 'nextPublicationNumber/:departmentId',
    operationId: 'getNextPublicationNumber',
    summary: 'Get next publication number for department',
    responseType: GetNextPublicationNumberResponse,
    params: [{ name: 'departmentId', type: 'string', required: true }],
  })
  async getNextPublicationNumber(
    @Param('departmentId', new UUIDValidationPipe()) departmentId: string,
  ): Promise<GetNextPublicationNumberResponse> {
    return ResultWrapper.unwrap(
      await this.caseService.getNextCasePublicationNumber(departmentId),
    )
  }

  @Route({
    path: 'departments',
    operationId: 'getDepartments',
    summary: 'Return all departments',
    responseType: GetDepartmentsResponse,
    query: [{ type: DefaultSearchParams }],
  })
  async departments(
    @Query() params: DefaultSearchParams,
  ): Promise<GetDepartmentsResponse> {
    return ResultWrapper.unwrap(
      await this.journalService.getDepartments(params),
    )
  }

  @Route({
    path: 'communicationStatuses',
    operationId: 'getCommunicationStatuses',
    summary: 'Get communication statuses',
    responseType: GetCommunicationSatusesResponse,
  })
  async communicationStatues(): Promise<GetCommunicationSatusesResponse> {
    return ResultWrapper.unwrap(
      await this.caseService.getCommunicationStatuses(),
    )
  }

  @Route({
    path: 'tags',
    operationId: 'getTags',
    summary: 'Get tags',
    responseType: GetTagsResponse,
  })
  async tags(): Promise<GetTagsResponse> {
    return ResultWrapper.unwrap(await this.caseService.getCaseTags())
  }

  @Route({
    path: 'types',
    operationId: 'getTypes',
    summary: 'Get advert types',
    responseType: GetAdvertTypesResponse,
    query: [{ type: GetAdvertTypesQueryParams }],
  })
  async types(
    @Query()
    params?: GetAdvertTypesQueryParams,
  ): Promise<GetAdvertTypesResponse> {
    return ResultWrapper.unwrap(await this.journalService.getTypes(params))
  }

  @Route({
    path: 'categories',
    operationId: 'getCategories',
    summary: 'Get categories',
    responseType: GetCategoriesResponse,
    query: [{ type: DefaultSearchParams }],
  })
  async categories(
    @Query()
    params?: DefaultSearchParams,
  ): Promise<GetCategoriesResponse> {
    return ResultWrapper.unwrap(await this.journalService.getCategories(params))
  }

  @Route({
    path: 'overview',
    operationId: 'editorialOverview',
    summary: 'Get editorial overview',
    responseType: EditorialOverviewResponse,
    query: [{ type: GetCasesQuery }],
  })
  async editorialOverview(
    @Query() params?: GetCasesQuery,
  ): Promise<EditorialOverviewResponse> {
    return ResultWrapper.unwrap(await this.caseService.getCasesOverview(params))
  }

  @Route({
    path: ':caseId/attachments/:attachmentId',
    params: [
      { name: 'caseId', type: 'string', required: true },
      { name: 'attachmentId', type: 'string', required: true },
    ],
    summary: 'Get case attachment',
    operationId: 'getCaseAttachment',
    responseType: PresignedUrlResponse,
  })
  async getCaseAttachment(
    @Param('caseId', new UUIDValidationPipe()) caseId: string,
    @Param('attachmentId', new UUIDValidationPipe()) attachmentId: string,
  ): Promise<PresignedUrlResponse> {
    return ResultWrapper.unwrap(
      await this.caseService.getCaseAttachment(caseId, attachmentId),
    )
  }

  @Route({
    method: 'put',
    path: ':caseId/attachments/:attachmentId',
    operationId: 'overwriteCaseAttachment',
    summary: 'Overwrite case attachment',
    params: [
      { name: 'caseId', type: 'string', required: true },
      { name: 'attachmentId', type: 'string', required: true },
    ],
    bodyType: PostApplicationAttachmentBody,
    responseType: PresignedUrlResponse,
  })
  async overwriteCaseAttachment(
    @Param('caseId', new UUIDValidationPipe()) caseId: string,
    @Param('attachmentId', new UUIDValidationPipe()) attachmentId: string,
    @Body() body: PostApplicationAttachmentBody,
  ): Promise<PresignedUrlResponse> {
    return (
      await this.caseService.overwriteCaseAttachment(caseId, attachmentId, body)
    ).unwrap()
  }

  @Route({
    method: 'put',
    path: ':id/price',
    operationId: 'updatePrice',
    summary: 'Update case price',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: UpdateCasePriceBody,
  })
  async updatePrice(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateCasePriceBody,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.updateCasePrice(id, body))
  }

  @Route({
    method: 'put',
    path: ':id/paid',
    operationId: 'updatePaid',
    summary: 'Update paid status of case',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: UpdatePaidBody,
  })
  async updatePaid(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdatePaidBody,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.updateCasePaid(id, body))
  }

  @Route({
    method: 'put',
    path: ':id/tag',
    operationId: 'updateTag',
    summary: 'Update tag value of case',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: UpdateTagBody,
  })
  async updateTag(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateTagBody,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.updateCaseTag(id, body))
  }

  @Route({
    method: 'put',
    path: ':id/department',
    operationId: 'updateDepartment',
    summary: 'Update department of case and application',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: UpdateCaseDepartmentBody,
  })
  async updateDepartment(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateCaseDepartmentBody,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.updateCaseDepartment(id, body))
  }

  @Route({
    method: 'put',
    path: ':id/communicationStatus',
    operationId: 'updateCommunicationStatus',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: UpdateCommunicationStatusBody,
  })
  async updateCommunicationStatus(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateCommunicationStatusBody,
  ): Promise<void> {
    ResultWrapper.unwrap(
      await this.caseService.updateCaseCommunicationStatus(id, body),
    )
  }

  @Route({
    method: 'put',
    path: ':id/type',
    operationId: 'updateType',
    summary: 'Update type of case and application',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: UpdateCaseTypeBody,
  })
  async updateType(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateCaseTypeBody,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.updateCaseType(id, body))
  }

  @Route({
    method: 'put',
    path: ':id/publishDate',
    operationId: 'updatePublishDate',
    summary: 'Update publish date of case and application',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: UpdatePublishDateBody,
  })
  async updatePublishDate(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdatePublishDateBody,
  ): Promise<void> {
    ResultWrapper.unwrap(
      await this.caseService.updateCaseRequestedPublishDate(id, body),
    )
  }

  @Route({
    method: 'put',
    path: ':id/title',
    operationId: 'updateTitle',
    summary: 'Update title of case and application',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: UpdateTitleBody,
  })
  async updateTitle(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateTitleBody,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.updateCaseTitle(id, body))
  }

  @Route({
    method: 'put',
    path: ':id/categories',
    operationId: 'updateCategories',
    summary: 'Update categories of case and application',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: UpdateCategoriesBody,
  })
  async updateCategories(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateCategoriesBody,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.updateCaseCategories(id, body))
  }

  @Route({
    method: 'put',
    path: ':id/status/next',
    operationId: 'updateNextStatus',
    summary: 'Update case status to next.',
    bodyType: UpdateNextStatusBody,
    params: [{ name: 'id', type: 'string', required: true }],
  })
  async updateNextStatus(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateNextStatusBody,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.updateCaseNextStatus(id, body))
  }

  @Route({
    method: 'put',
    path: ':id/status/previous',
    operationId: 'updatePreviousStatus',
    summary: 'Update case status to previous.',
    bodyType: UpdateNextStatusBody,
    params: [{ name: 'id', type: 'string', required: true }],
  })
  async updatePreviousStatus(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateNextStatusBody,
  ): Promise<void> {
    ResultWrapper.unwrap(
      await this.caseService.updateCasePreviousStatus(id, body),
    )
  }

  @Route({
    method: 'put',
    path: ':id/assign/:userId',
    operationId: 'assignEmployee',
    summary: 'Updates assigned user on the case.',
    params: [
      { name: 'id', type: 'string', required: true },
      { name: 'userId', type: 'string', required: true },
    ],
  })
  async assign(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Param('userId', new UUIDValidationPipe()) userId: string,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.updateEmployee(id, userId))
  }

  @Route({
    method: 'put',
    path: ':id/status',
    operationId: 'updateCaseStatus',
    params: [{ name: 'id', type: 'string', required: true }],
    summary: 'Update case status.',
    bodyType: UpdateCaseStatusBody,
  })
  async updateStatus(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateCaseStatusBody,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.updateCaseStatus(id, body))
  }

  @Route({
    method: 'put',
    path: ':id/html',
    operationId: 'updateAdvertHtml',
    params: [{ name: 'id', type: 'string', required: true }],
    summary: 'Update advert html',
    bodyType: UpdateAdvertHtmlBody,
  })
  async updateAdvertHtml(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateAdvertHtmlBody,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.updateAdvert(id, body))
  }

  @Route({
    path: ':id',
    operationId: 'getCase',
    summary: 'Get case by ID.',
    params: [{ name: 'id', type: 'string', required: true }],
    responseType: GetCaseResponse,
  })
  async case(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<GetCaseResponse> {
    return ResultWrapper.unwrap(await this.caseService.getCase(id))
  }

  @Route({
    method: 'post',
    operationId: 'createCase',
    summary: 'Create case.',
    bodyType: PostApplicationBody,
    responseType: CreateCaseResponse,
  })
  async createCase(@Body() body: PostApplicationBody): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.createCase(body))
  }

  // @UseGuards(AdminAuthGuard)
  // @Roles(USER_ROLES.Admin)
  @Route({
    path: '',
    operationId: 'getCases',
    summary: 'Get cases',
    responseType: GetCasesReponse,
    query: [{ type: GetCasesQuery }],
  })
  async cases(@Query() params?: GetCasesQuery): Promise<GetCasesReponse> {
    return ResultWrapper.unwrap(await this.caseService.getCases(params))
  }

  @Route({
    path: '/published/:department',
    operationId: 'getPublishedCases',
    summary: 'Get cases',
    responseType: GetPublishedCasesResponse,
    params: [{ name: 'department', type: 'string', required: true }],
    query: [{ type: GetFinishedCasesQuery, required: false }],
  })
  async getFinishedCases(
    @Param('department') department: string,
    @Query() query?: GetFinishedCasesQuery,
  ): Promise<GetCasesReponse> {
    return ResultWrapper.unwrap(
      await this.caseService.getFinishedCases(department, query),
    )
  }

  @Route({
    method: 'post',
    path: 'publish',
    operationId: 'publish',
    summary: 'Publish cases',
    bodyType: PostCasePublishBody,
  })
  async publish(@Body() body: PostCasePublishBody): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.publishCases(body))
  }

  @Route({
    method: 'post',
    path: ':id/unpublish',
    operationId: 'unpublish',
    params: [{ name: 'id', type: 'string', required: true }],
    description: 'Unpublish case',
  })
  async unpublish(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.unpublishCase(id))
  }

  @Route({
    method: 'post',
    path: ':id/reject',
    operationId: 'rejectCase',
    params: [{ name: 'id', type: 'string', required: true }],
    description: 'Reject case',
  })
  async reject(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.rejectCase(id))
  }

  @Route({
    path: ':id/comments',
    operationId: 'getComments',
    summary: 'Get case comments',
    responseType: GetCaseCommentsResponse,
    params: [{ name: 'id', type: 'string', required: true }],
    query: [{ type: GetCaseCommentsQuery }],
  })
  async getComments(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<GetCaseCommentsResponse> {
    return ResultWrapper.unwrap(
      await this.commentService.getComments(
        id,
        false,
        CaseCommentSourceEnum.API,
      ),
    )
  }

  @Route({
    path: ':id/comments/:commentId',
    operationId: 'getComment',
    summary: 'Get case comment',
    params: [
      { name: 'id', type: 'string', required: true },
      { name: 'commentId', type: 'string', required: true },
    ],
    responseType: GetCaseCommentResponse,
  })
  async getComment(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Param('commentId', new UUIDValidationPipe()) commentId: string,
  ): Promise<GetCaseCommentResponse> {
    return ResultWrapper.unwrap(
      await this.commentService.getComment(
        id,
        commentId,
        CaseCommentSourceEnum.API,
      ),
    )
  }

  @Route({
    method: 'post',
    path: ':id/comments',
    operationId: 'createComment',
    summary: 'Add comment to case',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: PostCaseCommentBody,
  })
  async createComment(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: PostCaseCommentBody,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.commentService.createComment(id, body))

    //If it's a message, update the application status to "waiting for answers"
    if (body.type === CaseCommentTypeTitleEnum.Message) {
      ResultWrapper.unwrap(
        await this.caseService.updateCaseCommunicationStatusByStatus(
          id,
          CaseCommunicationStatus.WaitingForAnswers,
        ),
      )
    }
  }

  @Route({
    method: 'delete',
    path: ':id/comments/:commentId',
    operationId: 'deleteComment',
    summary: 'Delete comment from case',
    params: [
      { name: 'id', type: 'string', required: true },
      { name: 'commentId', type: 'string', required: true },
    ],
  })
  async deleteComment(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Param('commentId', new UUIDValidationPipe()) commentId: string,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.commentService.deleteComment(id, commentId))
  }
}
