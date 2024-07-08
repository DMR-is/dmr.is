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
  UpdateCategoriesBody,
} from '@dmr.is/shared/dto'

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
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
  async departments(): Promise<GetDepartmentsResponse> {
    const result = await this.journalService.getDepartments()

    if (!result.ok) {
      throw new HttpException(result.error.message, result.error.code)
    }

    return result.value
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
  async types(
    @Query()
    params?: GetAdvertTypesQueryParams,
  ): Promise<GetAdvertTypesResponse> {
    const result = await this.journalService.getTypes(params)

    if (!result.ok) {
      throw new HttpException(result.error, result.error.code)
    }

    return Promise.resolve({
      ...result.value,
    })
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
  async categories(
    @Query()
    params?: GetCategoriesQueryParams,
  ): Promise<GetCategoriesResponse> {
    const result = await this.journalService.getCategories(params)

    if (!result.ok) {
      throw new HttpException(result.error.message, result.error.code)
    }

    return result.value
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
  async editorialOverview(
    @Query() params?: GetCasesQuery,
  ): Promise<EditorialOverviewResponse> {
    const result = await this.caseService.overview(params)

    if (!result.ok) {
      throw new HttpException(result.error.message, result.error.code)
    }

    return result.value
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
  async updatePrice(
    @Param('id') id: string,
    @Body() body: UpdateCasePriceBody,
  ): Promise<void> {
    const result = await this.caseService.updatePrice(id, body.price)

    if (!result.ok) {
      throw new HttpException(result.error.message, result.error.code)
    }
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
  async updateDepartment(
    @Param('id') id: string,
    @Body() body: UpdateCaseDepartmentBody,
  ): Promise<void> {
    const result = await this.caseService.updateDepartment(
      id,
      body.departmentId,
    )

    if (!result.ok) {
      throw new HttpException(result.error.message, result.error.code)
    }
  }

  @Put(':id/categories')
  @ApiOperation({
    operationId: 'updateCategories',
    summary: 'Update categories of case and application',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    required: true,
  })
  @ApiBody({
    type: UpdateCategoriesBody,
    required: true,
  })
  @ApiNoContentResponse()
  async updateCategories(
    @Param('id') id: string,
    @Body() body: UpdateCategoriesBody,
  ): Promise<void> {
    const result = await this.caseService.updateCategories(id, body)

    if (!result.ok) {
      throw new HttpException(result.error.message, result.error.code)
    }
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
  async updateNextStatus(@Param('id') id: string): Promise<void> {
    const result = await this.caseService.updateNextStatus(id)

    if (!result.ok) {
      throw new HttpException(result.error.message, result.error.code)
    }
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
  async assign(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    const result = await this.caseService.assign(id, userId)

    if (!result.ok) {
      throw new HttpException(result.error.message, result.error.code)
    }
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
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateCaseStatusBody,
  ): Promise<void> {
    const result = await this.caseService.updateStatus(id, body)

    if (!result.ok) {
      throw new HttpException(result.error.message, result.error.code)
    }
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
  async case(@Param('id') id: string): Promise<GetCaseResponse> {
    const result = await this.caseService.case(id)

    if (!result.ok) {
      throw new HttpException(result.error.message, result.error.code)
    }

    return result.value
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
  async createCase(
    @Body() body: PostApplicationBody,
  ): Promise<CreateCaseResponse> {
    const result = await this.caseService.create(body)

    if (!result.ok) {
      throw new HttpException(result.error.message, result.error.code)
    }

    return result.value
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
  async cases(@Query() params?: GetCasesQuery): Promise<GetCasesReponse> {
    const result = await this.caseService.cases(params)
    if (!result.ok) {
      throw new HttpException(result.error.message, result.error.code)
    }

    return result.value
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
  async publish(@Body() body: PostCasePublishBody): Promise<void> {
    const result = await this.caseService.publish(body)

    if (!result.ok) {
      throw new HttpException(result.error.message, result.error.code)
    }
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
  async getComments(
    @Param('id') id: string,
    @Query() params?: GetCaseCommentsQuery,
  ): Promise<GetCaseCommentsResponse> {
    const results = await this.caseCommentService.comments(id, params)

    if (!results.ok) {
      throw new HttpException(results.error.message, results.error.code)
    }

    return results.value
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
  async getComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ): Promise<GetCaseCommentResponse> {
    const results = await this.caseCommentService.comment(id, commentId)

    if (!results.ok) {
      throw new HttpException(results.error.message, results.error.code)
    }
    return results.value
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
  async createComment(
    @Param('id') id: string,
    @Body() body: PostCaseComment,
  ): Promise<PostCaseCommentResponse> {
    const results = await this.caseCommentService.create(id, body)

    if (!results.ok) {
      throw new HttpException(results.error.message, results.error.code)
    }
    return results.value
  }

  @Delete(':id/comments/:commentId')
  @ApiOperation({
    operationId: 'deleteComment',
    summary: 'Delete comment from case',
  })
  @ApiNoContentResponse()
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
