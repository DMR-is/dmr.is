import slugify from 'slugify'
import { v4 as uuid } from 'uuid'
import { USER_ROLES } from '@dmr.is/constants'
import { Roles, Route, TimeLog } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  ICaseService,
  ICommentService,
  IJournalService,
  RoleGuard,
  TokenJwtAuthGuard,
} from '@dmr.is/modules'
import { EnumValidationPipe, UUIDValidationPipe } from '@dmr.is/pipelines'
import {
  AddCaseAdvertCorrection,
  CaseCommentSourceEnum,
  CaseCommentTypeTitleEnum,
  CaseCommunicationStatus,
  CaseStatusEnum,
  CreateCaseResponse,
  CreateMainCategory,
  CreateMainCategoryCategories,
  DefaultSearchParams,
  DeleteCaseAdvertCorrection,
  DepartmentEnum,
  GetCaseCommentResponse,
  GetCaseCommentsQuery,
  GetCaseCommentsResponse,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  GetCasesWithDepartmentCount,
  GetCasesWithDepartmentCountQuery,
  GetCasesWithPublicationNumber,
  GetCasesWithPublicationNumberQuery,
  GetCasesWithStatusCount,
  GetCasesWithStatusCountQuery,
  GetCategoriesResponse,
  GetCommunicationSatusesResponse,
  GetDepartmentsResponse,
  GetMainCategoriesResponse,
  GetNextPublicationNumberResponse,
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
  Get,
  Inject,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger'

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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
  async updateMainCategory(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateMainCategory,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.journalService.updateMainCategory(id, body))
  }

  @Get('/status-count/:status')
  @ApiOperation({ operationId: 'getCasesWithStatusCount' })
  @ApiParam({
    name: 'status',
    enum: CaseStatusEnum,
    enumName: 'CaseStatusEnum',
    description: 'Cases with this status will be returned',
  })
  @ApiQuery({ type: GetCasesWithStatusCountQuery })
  @ApiResponse({ status: 200, type: GetCasesWithStatusCount })
  @TimeLog()
  /**
   * Returns cases with status count, by default count cases for every status.
   * @param status - Status of the cases to be returned
   */
  async getCasesWithStatusCount(
    @Param('status', new EnumValidationPipe(CaseStatusEnum))
    status: CaseStatusEnum,
    @Query() params?: GetCasesQuery,
  ): Promise<GetCasesWithStatusCount> {
    return ResultWrapper.unwrap(
      await this.caseService.getCasesWithStatusCount(status, params),
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
    method: 'put',
    path: ':id/categories',
    operationId: 'updateCategories',
    summary: 'Update categories of case and application',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: UpdateCategoriesBody,
  })
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
  async updateAdvertHtml(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateAdvertHtmlBody,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.updateAdvertByHtml(id, body))
  }

  @UseGuards(TokenJwtAuthGuard, RoleGuard)
  @Roles(USER_ROLES.Admin)
  @Route({
    path: ':id',
    operationId: 'getCase',
    summary: 'Get case by ID.',
    params: [{ name: 'id', type: 'string', required: true }],
    responseType: GetCaseResponse,
  })
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
  async cases(@Query() params?: GetCasesQuery): Promise<GetCasesReponse> {
    return ResultWrapper.unwrap(await this.caseService.getCases(params))
  }

  @Get('/department-count/:department')
  @ApiOperation({ operationId: 'getCasesWithDepartmentCount' })
  @ApiParam({
    name: 'department',
    enum: DepartmentEnum,
    enumName: 'DepartmentEnum',
  })
  @ApiQuery({ name: 'query', type: GetCasesWithDepartmentCountQuery })
  @ApiResponse({ status: 200, type: GetCasesWithDepartmentCount })
  @TimeLog()
  async getCasesWithDepartmentCount(
    @Param('department', new EnumValidationPipe(DepartmentEnum))
    department: DepartmentEnum,
    @Query() query?: GetCasesWithDepartmentCountQuery,
  ): Promise<GetCasesWithDepartmentCount> {
    return ResultWrapper.unwrap(
      await this.caseService.getCasesWithDepartmentCount(department, query),
    )
  }

  @Route({
    method: 'post',
    path: 'publish',
    operationId: 'publish',
    summary: 'Publish cases',
    bodyType: PostCasePublishBody,
  })
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
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
  @TimeLog()
  async deleteComment(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Param('commentId', new UUIDValidationPipe()) commentId: string,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.commentService.deleteComment(id, commentId))
  }

  @Get('/with-publication-number/:department')
  @ApiOperation({ operationId: 'getCasesWithPublicationNumber' })
  @ApiParam({
    name: 'department',
    enum: DepartmentEnum,
    enumName: 'DepartmentEnum',
  })
  @ApiQuery({ type: GetCasesWithPublicationNumberQuery })
  @ApiResponse({ status: 200, type: GetCasesWithPublicationNumber })
  @TimeLog()
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
}
