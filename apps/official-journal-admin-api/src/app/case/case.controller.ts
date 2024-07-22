import { Route } from '@dmr.is/decorators'
import { ICaseService, ICommentService, IJournalService } from '@dmr.is/modules'
import {
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
  GetDepartmentsResponse,
  GetTagsResponse,
  PostApplicationBody,
  PostCaseComment,
  PostCaseCommentResponse,
  PostCasePublishBody,
  UpdateCaseDepartmentBody,
  UpdateCasePriceBody,
  UpdateCaseStatusBody,
  UpdateCaseTypeBody,
  UpdateCategoriesBody,
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
  NotFoundException,
  Param,
  Query,
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
    private readonly caseCommentService: ICommentService,
  ) {}

  @Route({
    path: 'departments',
    operationId: 'getDepartments',
    summary: 'Return all departments',
    responseType: GetDepartmentsResponse,
  })
  async departments(): Promise<GetDepartmentsResponse> {
    return ResultWrapper.unwrap(await this.journalService.getDepartments())
  }

  @Route({
    path: 'types',
    operationId: 'getTypes',
    summary: 'Get advert types',
    responseType: GetAdvertTypesResponse,
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
  })
  async editorialOverview(
    @Query() params?: GetCasesQuery,
  ): Promise<EditorialOverviewResponse> {
    return ResultWrapper.unwrap(await this.caseService.overview(params))
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
    @Param('id') id: string,
    @Body() body: UpdateCasePriceBody,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.updatePrice(id, body.price))
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
    @Param('id') id: string,
    @Body() body: UpdateCaseDepartmentBody,
  ): Promise<void> {
    ResultWrapper.unwrap(
      await this.caseService.updateDepartment(id, body.departmentId),
    )
  }

  @Route({
    method: 'put',
    path: ':id/status/next',
    operationId: 'updateNextStatus',
    summary: 'Update case status to next.',
    params: [{ name: 'id', type: 'string', required: true }],
  })
  async updateNextStatus(@Param('id') id: string): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.updateNextStatus(id))
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
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.assign(id, userId))
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
    @Param('id') id: string,
    @Body() body: UpdateCaseStatusBody,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.updateStatus(id, body))
  }

  @Route({
    path: ':id',
    operationId: 'getCase',
    summary: 'Get case by ID.',
    params: [{ name: 'id', type: 'string', required: true }],
    responseType: GetCaseResponse,
  })
  async case(@Param('id') id: string): Promise<GetCaseResponse> {
    return ResultWrapper.unwrap(await this.caseService.case(id))
  }

  @Route({
    method: 'post',
    operationId: 'createCase',
    summary: 'Create case.',
    bodyType: PostApplicationBody,
    responseType: CreateCaseResponse,
  })
  async createCase(
    @Body() body: PostApplicationBody,
  ): Promise<CreateCaseResponse> {
    return ResultWrapper.unwrap(await this.caseService.create(body))
  }

  @Route({
    path: '',
    operationId: 'getCases',
    summary: 'Get cases',
    responseType: GetCasesReponse,
  })
  async cases(@Query() params?: GetCasesQuery): Promise<GetCasesReponse> {
    return ResultWrapper.unwrap(await this.caseService.cases(params))
  }

  @Route({
    method: 'post',
    path: 'publish',
    operationId: 'publish',
    summary: 'Publish cases',
    bodyType: PostCasePublishBody,
  })
  async publish(@Body() body: PostCasePublishBody): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.publish(body))
  }

  @Route({
    path: ':id/comments',
    operationId: 'getComments',
    summary: 'Get case comments',
    responseType: GetCaseCommentsResponse,
    params: [{ name: 'id', type: 'string', required: true }],
    query: [
      {
        type: GetCaseCommentsQuery,
      },
    ],
  })
  async getComments(
    @Param('id') id: string,
    @Query() params?: GetCaseCommentsQuery,
  ): Promise<GetCaseCommentsResponse> {
    return ResultWrapper.unwrap(
      await this.caseCommentService.comments(id, params),
    )
  }

  @Route({
    path: ':id/comments/:commentId',
    operationId: 'getComment',
    summary: 'Get case comment',
    responseType: GetCaseCommentResponse,
    params: [
      { name: 'id', type: 'string', required: true },
      { name: 'commentId', type: 'string', required: true },
    ],
  })
  async getComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ): Promise<GetCaseCommentResponse> {
    return ResultWrapper.unwrap(
      await this.caseCommentService.comment(id, commentId),
    )
  }

  @Route({
    path: ':id/comments',
    operationId: 'createComment',
    summary: 'Add comment to case',
    bodyType: PostCaseComment,
    responseType: PostCaseCommentResponse,
    params: [{ name: 'id', type: 'string', required: true }],
  })
  async createComment(
    @Param('id') id: string,
    @Body() body: PostCaseComment,
  ): Promise<PostCaseCommentResponse> {
    return ResultWrapper.unwrap(await this.caseCommentService.create(id, body))
  }

  @Route({
    method: 'delete',
    operationId: 'deleteComment',
    summary: 'Delete comment from case',
    params: [
      { name: 'id', type: 'string', required: true },
      { name: 'commentId', type: 'string', required: true },
    ],
  })
  async deleteComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ): Promise<void> {
    const result = await this.caseCommentService.delete(id, commentId)

    if (!result) {
      throw new NotFoundException(
        `Comment<${commentId}> not found on case<${id}>`,
      )
    }
  }
}
