import { ICaseService, ICommentService } from '@dmr.is/modules'
import {
  Case,
  CaseComment,
  CaseEditorialOverview,
  CreateCaseResponse,
  DeleteCaseCommentResponse,
  GetCaseCommentResponse,
  GetCaseCommentsQuery,
  GetCaseCommentsResponse,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  PostApplicationBody,
  PostCaseComment,
  PostCaseCommentResponse,
  PostCasePublishBody,
} from '@dmr.is/shared/dto'

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common'
import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'

@Controller({
  version: '1',
})
export class CaseController {
  constructor(
    @Inject(ICaseService)
    private readonly caseService: ICaseService,

    @Inject(ICommentService)
    private readonly caseCommentService: ICommentService,
  ) {}

  @Get('case')
  @ApiQuery({ name: 'id', type: String, required: true })
  @ApiOperation({
    operationId: 'getCase',
    summary: 'Get case by ID.',
  })
  @ApiResponse({
    status: 200,
    type: Case,
    description: 'Case by ID.',
  })
  @ApiResponse({
    status: 404,
    description: 'Case not found.',
  })
  async case(@Query('id') id: string): Promise<GetCaseResponse> {
    return this.caseService.getCase(id)
  }

  @Post('')
  @ApiOperation({
    operationId: 'postCase',
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
    return this.caseService.createCase(body)
  }

  @Get('cases')
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
    return this.caseService.getCases(params)
  }

  @Get('editorialOverview')
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
    return this.caseService.getEditorialOverview(params)
  }

  @Post('publish')
  @ApiOperation({
    operationId: 'postPublish',
    summary: 'Publish cases',
  })
  @ApiResponse({
    status: 200,
    description: 'Cases published',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async publish(@Body() body: PostCasePublishBody): Promise<void> {
    try {
      await this.caseService.postCasesPublish(body)
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST)
      }

      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get(':caseId/comments')
  @ApiOperation({
    operationId: 'getComments',
    summary: 'Get case comments',
  })
  @ApiResponse({
    status: 200,
    type: [CaseComment],
    description: 'Comments for case',
  })
  async getComments(
    @Param('caseId') caseId: string,
    @Query('params') params?: GetCaseCommentsQuery,
  ): Promise<GetCaseCommentsResponse> {
    return this.caseCommentService.getComments(caseId, params)
  }

  @Get(':caseId/comments/:commentId')
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
    @Param('caseId') caseId: string,
    @Param('commentId') commentId: string,
  ): Promise<GetCaseCommentResponse> {
    return this.caseCommentService.getComment(caseId, commentId)
  }

  @Post(':caseId/comments')
  @ApiOperation({
    operationId: 'postComment',
    summary: 'Add comment to case',
  })
  @ApiResponse({
    type: [CaseComment],
    status: 200,
    description: 'Comment added',
  })
  async postComment(
    @Param('caseId') id: string,
    @Body() body: PostCaseComment,
  ): Promise<PostCaseCommentResponse> {
    return this.caseCommentService.postComment(id, body)
  }

  @Delete(':caseId/comments/:commentId')
  @ApiOperation({
    operationId: 'deleteComment',
    summary: 'Delete comment from case',
  })
  @ApiResponse({
    type: [CaseComment],
    status: 200,
    description: 'Comment deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Comment not found',
  })
  async deleteComment(
    @Param('caseId') caseId: string,
    @Param('commentId') commentId: string,
  ): Promise<DeleteCaseCommentResponse> {
    return this.caseCommentService.deleteComment(caseId, commentId)
  }
}
