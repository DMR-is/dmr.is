import { LogMethod } from '@dmr.is/decorators'
import { ICaseService, ICommentService, IJournalService } from '@dmr.is/modules'
import {
  CreateCaseResponse,
  EditorialOverviewResponse,
  GetAdvertTypesQueryParams,
  GetAdvertTypesResponse,
  GetCaseCommentResponse,
  GetCaseCommentsQuery,
  GetCaseCommentsResponse,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  GetCategoriesQueryParams,
  GetCategoriesResponse,
  GetDepartmentsResponse,
  PostApplicationBody,
  PostCaseComment,
  PostCaseCommentResponse,
  PostCasePublishBody,
  UpdateCaseDepartmentBody,
  UpdateCasePriceBody,
  UpdateCaseStatusBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger'

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

  @Get('departments')
  @ApiOperation({
    operationId: 'getDepartments',
    summary: 'Get departments',
  })
  @ApiResponse({
    type: GetDepartmentsResponse,
    status: 200,
    description: 'Departments',
  })
  @LogMethod()
  async departments(): Promise<GetDepartmentsResponse> {
    return ResultWrapper.unwrap(await this.journalService.getDepartments())
  }

  @Get('types')
  @ApiResponse({
    status: 200,
    type: GetAdvertTypesResponse,
    description: 'List of advert types.',
  })
  @ApiOperation({
    operationId: 'getTypes',
    summary: 'Get advert types.',
  })
  @LogMethod()
  async types(
    @Query()
    params?: GetAdvertTypesQueryParams,
  ): Promise<GetAdvertTypesResponse> {
    return ResultWrapper.unwrap(await this.journalService.getTypes(params))
  }

  @Get('categories')
  @ApiOperation({
    operationId: 'getCategories',
    summary: 'Get categories',
  })
  @ApiResponse({
    status: 200,
    type: GetCategoriesResponse,
    description: 'Categories',
  })
  @LogMethod()
  async categories(
    @Query()
    params?: GetCategoriesQueryParams,
  ): Promise<GetCategoriesResponse> {
    return ResultWrapper.unwrap(await this.journalService.getCategories(params))
  }

  @Get('overview')
  @ApiOperation({
    operationId: 'getEditorialOverview',
    summary: 'Get overview for cases in progress.',
  })
  @ApiResponse({
    status: 200,
    type: EditorialOverviewResponse,
    description: 'Cases overview.',
  })
  @LogMethod()
  async editorialOverview(
    @Query() params?: GetCasesQuery,
  ): Promise<EditorialOverviewResponse> {
    return ResultWrapper.unwrap(await this.caseService.overview(params))
  }

  @Put(':id/price')
  @ApiOperation({
    operationId: 'updatePrice',
    summary: 'Update case price',
  })
  @ApiNoContentResponse()
  @ApiParam({
    name: 'id',
    type: 'string',
    required: true,
  })
  @ApiBody({
    type: UpdateCasePriceBody,
    required: true,
  })
  @LogMethod()
  async updatePrice(
    @Param('id') id: string,
    @Body() body: UpdateCasePriceBody,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.updatePrice(id, body.price))
  }

  @Put(':id/department')
  @ApiOperation({
    operationId: 'updateDepartment',
    summary: 'Update department of case and application',
  })
  @ApiNoContentResponse()
  @ApiParam({
    name: 'id',
    type: 'string',
    required: true,
  })
  @ApiBody({
    type: UpdateCaseDepartmentBody,
    required: true,
  })
  @LogMethod()
  async updateDepartment(
    @Param('id') id: string,
    @Body() body: UpdateCaseDepartmentBody,
  ): Promise<void> {
    ResultWrapper.unwrap(
      await this.caseService.updateDepartment(id, body.departmentId),
    )
  }

  @Post(':id/status/next')
  @ApiOperation({
    operationId: 'updateNextStatus',
    summary: 'Update case status to next.',
  })
  @ApiNoContentResponse()
  @ApiParam({
    name: 'id',
    type: 'string',
    required: true,
  })
  @LogMethod()
  async updateNextStatus(@Param('id') id: string): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.updateNextStatus(id))
  }

  @Post(':id/assign/:userId')
  @ApiOperation({
    operationId: 'assignEmployee',
    summary: 'Assign case to user.',
  })
  @ApiNoContentResponse()
  @ApiParam({
    name: 'id',
    type: 'string',
    required: true,
  })
  @ApiParam({
    name: 'userId',
    type: 'string',
    required: true,
  })
  @LogMethod()
  async assign(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.assign(id, userId))
  }

  @Post(':id/status')
  @ApiOperation({
    operationId: 'updateCaseStatus',
    summary: 'Update case status.',
  })
  @ApiNoContentResponse()
  @ApiParam({
    name: 'id',
    type: 'string',
    required: true,
  })
  @ApiBody({
    type: UpdateCaseStatusBody,
    required: true,
  })
  @LogMethod()
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateCaseStatusBody,
  ): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.updateStatus(id, body))
  }

  @Get(':id')
  @ApiOperation({
    operationId: 'getCase',
    summary: 'Get case by ID.',
  })
  @ApiResponse({
    status: 200,
    type: GetCaseResponse,
    description: 'Case by ID.',
  })
  @ApiResponse({
    status: 404,
    description: 'Case not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  @HttpCode(200)
  @ApiParam({
    name: 'id',
    type: 'string',
    required: true,
  })
  @LogMethod()
  async case(@Param('id') id: string): Promise<GetCaseResponse> {
    return ResultWrapper.unwrap(await this.caseService.case(id))
  }

  @Post('')
  @ApiOperation({
    operationId: 'createCase',
    summary: 'Create case.',
  })
  @ApiResponse({
    status: 200,
    type: CreateCaseResponse,
    description: 'Case created.',
  })
  @ApiBody({
    type: PostApplicationBody,
    required: true,
  })
  @LogMethod()
  async createCase(
    @Body() body: PostApplicationBody,
  ): Promise<CreateCaseResponse> {
    return ResultWrapper.unwrap(await this.caseService.create(body))
  }

  @Get('')
  @ApiOperation({
    operationId: 'getCases',
    summary: 'Get cases.',
  })
  @ApiResponse({
    status: 200,
    type: GetCasesReponse,
    description: 'All cases.',
  })
  @LogMethod()
  async cases(@Query() params?: GetCasesQuery): Promise<GetCasesReponse> {
    return ResultWrapper.unwrap(await this.caseService.cases(params))
  }

  @Post('publish')
  @ApiOperation({
    operationId: 'publish',
    summary: 'Publish cases',
  })
  @ApiBody({
    type: PostCasePublishBody,
    required: true,
  })
  @ApiNoContentResponse()
  @LogMethod()
  async publish(@Body() body: PostCasePublishBody): Promise<void> {
    ResultWrapper.unwrap(await this.caseService.publish(body))
  }

  @Get(':id/comments')
  @ApiOperation({
    operationId: 'getComments',
    summary: 'Get case comments',
  })
  @ApiResponse({
    status: 200,
    type: GetCaseCommentsResponse,
    description: 'Comments for case',
  })
  @LogMethod()
  async getComments(
    @Param('id') id: string,
    @Query() params?: GetCaseCommentsQuery,
  ): Promise<GetCaseCommentsResponse> {
    return ResultWrapper.unwrap(
      await this.caseCommentService.comments(id, params),
    )
  }

  @Get(':id/comments/:commentId')
  @ApiOperation({
    operationId: 'getComment',
    summary: 'Get case comment',
  })
  @ApiResponse({
    status: 200,
    type: GetCaseCommentResponse,
    description: 'Comment for case',
  })
  @LogMethod()
  async getComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ): Promise<GetCaseCommentResponse> {
    return ResultWrapper.unwrap(
      await this.caseCommentService.comment(id, commentId),
    )
  }

  @Post(':id/comments')
  @ApiOperation({
    operationId: 'createComment',
    summary: 'Add comment to case',
  })
  @ApiResponse({
    type: PostCaseCommentResponse,
    status: 200,
    description: 'Comment created',
  })
  @LogMethod()
  async createComment(
    @Param('id') id: string,
    @Body() body: PostCaseComment,
  ): Promise<PostCaseCommentResponse> {
    return ResultWrapper.unwrap(await this.caseCommentService.create(id, body))
  }

  @Delete(':id/comments/:commentId')
  @ApiOperation({
    operationId: 'deleteComment',
    summary: 'Delete comment from case',
  })
  @ApiNoContentResponse()
  @LogMethod()
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
