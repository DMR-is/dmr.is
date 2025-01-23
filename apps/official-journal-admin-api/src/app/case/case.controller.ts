import slugify from 'slugify'
import { v4 as uuid } from 'uuid'
import { USER_ROLES } from '@dmr.is/constants'
import { Roles, Route } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  ICaseService,
  ICommentService,
  IJournalService,
  RoleGuard,
  TokenJwtAuthGuard,
} from '@dmr.is/modules'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import {
  AddCaseAdvertCorrection,
  CaseCommentSourceEnum,
  CaseCommentTypeTitleEnum,
  CaseCommunicationStatus,
  CaseOverviewQuery,
  CreateCaseResponse,
  CreateMainCategory,
  CreateMainCategoryCategories,
  DefaultSearchParams,
  DeleteCaseAdvertCorrection,
  GetCaseCommentResponse,
  GetCaseCommentsQuery,
  GetCaseCommentsResponse,
  GetCaseResponse,
  GetCasesOverview,
  GetCasesQuery,
  GetCasesReponse,
  GetCategoriesResponse,
  GetCommunicationSatusesResponse,
  GetDepartmentsResponse,
  GetMainCategoriesResponse,
  GetNextPublicationNumberResponse,
  GetPublishedCasesQuery as GetFinishedCasesQuery,
  GetPublishedCasesResponse,
  GetTagsResponse,
  MainCategory,
  PostApplicationAttachmentBody,
  PostApplicationBody,
  PostCaseCommentBody,
  PostCasePublishBody,
  PresignedUrlResponse,
  UpdateAdvertHtmlBody,
  UpdateAdvertHtmlCorrection,
  UpdateCaseDepartmentBody,
  UpdateCasePriceBody,
  UpdateCaseStatusBody,
  UpdateCaseTypeBody,
  UpdateCategoriesBody,
  UpdateCommunicationStatusBody,
  UpdateMainCategory,
  UpdateNextStatusBody,
  UpdatePaidBody,
  UpdatePublishDateBody,
  UpdateTagBody,
  UpdateTitleBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

const LOG_CATEGORY = 'case-controller'

@ApiBearerAuth()
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

    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

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

  @UseGuards(TokenJwtAuthGuard, RoleGuard)
  @Roles(USER_ROLES.Admin)
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
    path: 'main-categories',
    operationId: 'getMainCategories',
    summary: 'Get main categories',
    query: [{ type: DefaultSearchParams }],
    responseType: GetMainCategoriesResponse,
  })
  async mainCategories(): Promise<GetMainCategoriesResponse> {
    return ResultWrapper.unwrap(await this.journalService.getMainCategories())
  }

  @Route({
    method: 'delete',
    path: 'main-categories/:id',
    params: [{ name: 'id', type: 'string', required: true }],
    operationId: 'deleteMainCategory',
    summary: 'Delete main category',
  })
  async deleteMainCategory(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.journalService.deleteMainCategory(id))
  }

  @Route({
    method: 'delete',
    path: 'main-categories/:mainCategoryId/categories/:categoryId',
    params: [
      { name: 'mainCategoryId', type: 'string', required: true },
      { name: 'categoryId', type: 'string', required: true },
    ],
    operationId: 'deleteMainCategoryCategory',
    summary: 'Delete main category category',
  })
  async deleteMainCategoryCategory(
    @Param('mainCategoryId', new UUIDValidationPipe()) mainCategoryId: string,
    @Param('categoryId', new UUIDValidationPipe()) categoryId: string,
  ): Promise<void> {
    ResultWrapper.unwrap(
      await this.journalService.deleteMainCategoryCategory(
        mainCategoryId,
        categoryId,
      ),
    )
  }

  @Route({
    method: 'post',
    path: 'main-categories',
    operationId: 'createMainCategory',
    summary: 'Create main category',
    bodyType: CreateMainCategory,
  })
  async createMainCategory(@Body() body: CreateMainCategory): Promise<void> {
    const id = uuid()

    const subCategoriesLookup = await this.journalService.getCategories({
      ids: body.categories,
      pageSize: body.categories.length,
    })

    if (!subCategoriesLookup.result.ok) {
      this.logger.warn(
        `Failed to get sub categories for main category creation`,
        {
          error: subCategoriesLookup.result.error,
          category: LOG_CATEGORY,
        },
      )
      throw new BadRequestException('Invalid sub categories')
    }

    const newCategory: MainCategory = {
      id: id,
      title: body.title,
      slug: slugify(body.title, { lower: true }),
      description: body.description,
      categories: subCategoriesLookup.result.value.categories,
    }

    ResultWrapper.unwrap(
      await this.journalService.insertMainCategory(newCategory),
    )
  }

  @Route({
    method: 'post',
    path: 'main-categories/:mainCategoryId/categories',
    operationId: 'createMainCategoryCategories',
    params: [{ name: 'mainCategoryId', type: 'string', required: true }],
    bodyType: CreateMainCategoryCategories,
  })
  async createMainCategoryCategories(
    @Param('mainCategoryId', new UUIDValidationPipe()) mainCategoryId: string,
    @Body() body: CreateMainCategoryCategories,
  ): Promise<void> {
    ResultWrapper.unwrap(
      await this.journalService.insertMainCategoryCategories(
        mainCategoryId,
        body.categories,
      ),
    )
  }

  @Route({
    method: 'put',
    path: 'main-categories/:id',
    operationId: 'updateMainCategory',
    summary: 'Update main category',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: UpdateMainCategory,
  })
  async updateMainCategory(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateMainCategory,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.journalService.updateMainCategory(id, body))
  }

  @Route({
    path: 'overview/:status',
    params: [{ name: 'status', type: 'string', required: true }],
    operationId: 'editorialOverview',
    summary: 'Get editorial overview',
    responseType: GetCasesOverview,
    query: [{ type: CaseOverviewQuery }],
  })
  async editorialOverview(
    @Param('status') status: string,
    @Query() params?: CaseOverviewQuery,
  ): Promise<GetCasesOverview> {
    return ResultWrapper.unwrap(
      await this.caseService.getCasesOverview(status, params),
    )
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
    path: ':id/type',
    operationId: 'updateCaseType',
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
    method: 'post',
    path: ':id/correction',
    operationId: 'Add correction',
    summary: 'Add correction to case',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: AddCaseAdvertCorrection,
  })
  async postCorrection(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: AddCaseAdvertCorrection,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.postCaseCorrection(id, body))
  }

  @Route({
    method: 'delete',
    path: ':id/correction',
    operationId: 'Delete correction',
    summary: 'Delete correction from DB',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: DeleteCaseAdvertCorrection,
  })
  async deleteCorrection(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: DeleteCaseAdvertCorrection,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.deleteCorrection(id, body))
  }

  // TODO: Do we need a put for correction? Or is it just a post?

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
    path: ':id/update',
    operationId: 'updateCaseAndAddCorrection',
    params: [{ name: 'id', type: 'string', required: true }],
    summary: 'Update advert html + add correction details',
    bodyType: UpdateAdvertHtmlCorrection,
  })
  async updateAdvertHtmlCorrection(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateAdvertHtmlCorrection,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.updateAdvert(id, body))
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
    ResultWrapper.unwrap(await this.caseService.updateAdvertByHtml(id, body))
  }

  // TODO: ADD THIS BACK IN.
  // @UseGuards(TokenJwtAuthGuard, RoleGuard)
  // @Roles(USER_ROLES.Admin)
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
