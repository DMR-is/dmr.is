import { ICaseService, ICommentService, IJournalService } from '@dmr.is/modules'
import {
  CaseEditorialOverview,
  CreateCaseResponse,
  GetAdvertTypesQueryParams,
  GetAdvertTypesResponse,
  GetCaseCommentResponse,
  GetCaseCommentsQuery,
  GetCaseCommentsResponse,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  GetDepartmentsResponse,
  PostApplicationBody,
  PostCaseComment,
  PostCaseCommentResponse,
  PostCasePublishBody,
} from '@dmr.is/shared/dto'

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common'
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiQuery,
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

  @Get('overview')
  @ApiOperation({
    operationId: 'getEditorialOverview',
    summary: 'Get overview for cases in progress.',
  })
  @ApiResponse({
    status: 200,
    type: CaseEditorialOverview,
    description: 'Cases overview.',
  })
  async editorialOverview(
    @Query() params?: GetCasesQuery,
  ): Promise<CaseEditorialOverview> {
    const result = await this.caseService.overview(params)

    if (!result.ok) {
      throw new HttpException(result.error.message, result.error.code)
    }

    return result.value
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
    operationId: 'postPublish',
    summary: 'Publish cases',
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
    @Query('params') params?: GetCaseCommentsQuery,
  ): Promise<GetCaseCommentsResponse> {
    return this.caseCommentService.comments(id, params)
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
    return this.caseCommentService.comment(id, commentId)
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
    return this.caseCommentService.create(id, body)
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
