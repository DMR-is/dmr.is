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
  path: 'cases',
})
export class CaseController {
  constructor(
    @Inject(ICaseService)
    private readonly caseService: ICaseService,

    @Inject(ICommentService)
    private readonly caseCommentService: ICommentService,
  ) {}

  @Get(':id')
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
  async case(@Param('id') id: string): Promise<GetCaseResponse> {
    return this.caseService.case(id)
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
    return this.caseService.create(body)
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
    return this.caseService.cases(params)
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
    return this.caseService.overview(params)
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
      await this.caseService.publish(body)
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

  @Get(':id/comments')
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
    operationId: 'postComment',
    summary: 'Add comment to case',
  })
  @ApiResponse({
    type: [CaseComment],
    status: 200,
    description: 'Comment added',
  })
  async postComment(
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
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ): Promise<DeleteCaseCommentResponse> {
    return this.caseCommentService.delete(id, commentId)
  }
}
