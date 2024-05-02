import { ICaseService } from '@dmr.is/modules'
import {
  Case,
  CaseComment,
  CaseEditorialOverview,
  CaseWithApplication,
  GetCaseCommentsQuery,
  GetCasesQuery,
  GetCasesReponse,
  GetCasesWithApplicationReponse,
  GetUsersQueryParams,
  GetUsersResponse,
  PostCaseComment,
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
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'

@Controller({
  version: '1',
})
export class CaseController {
  constructor(
    @Inject(ICaseService)
    private readonly caseService: ICaseService,
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
  async case(@Query('id') id: string): Promise<Case | null> {
    return this.caseService.getCase(id)
  }

  @Get('case-with-application')
  @ApiQuery({ name: 'id', type: String, required: true })
  @ApiOperation({
    operationId: 'getCaseWithApplication',
    summary: 'Get case with application by ID.',
  })
  @ApiResponse({
    status: 200,
    type: CaseWithApplication,
    description: 'Case with application by ID.',
  })
  @ApiResponse({
    status: 404,
    description: 'Case with application not found.',
  })
  async caseWithApplication(
    @Query('id') id: string,
  ): Promise<CaseWithApplication | null> {
    return this.caseService.getCaseWithApplication(id)
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

  @Get('cases-with-application')
  @ApiOperation({
    operationId: 'getCasesWithApplication',
    summary: 'Get cases with application.',
  })
  @ApiResponse({
    status: 200,
    type: GetCasesWithApplicationReponse,
    description: 'All cases with application.',
  })
  async casesWithApplication(
    @Query() params?: GetCasesQuery,
  ): Promise<GetCasesWithApplicationReponse> {
    return this.caseService.getCasesWithApplication(params)
  }

  @Get('users')
  @ApiOperation({
    operationId: 'getUsers',
    summary: 'Get users.',
  })
  @ApiResponse({
    status: 200,
    type: GetUsersResponse,
    description: 'All active users.',
  })
  async users(
    @Query() params?: GetUsersQueryParams,
  ): Promise<GetUsersResponse> {
    return this.caseService.getUsers(params)
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
  ): Promise<CaseComment[]> {
    return this.caseService.getComments(caseId, params)
  }

  @Post(':caseId/comments')
  @ApiOperation({
    operationId: 'addComment',
    summary: 'Add comment to case',
  })
  @ApiResponse({
    type: [CaseComment],
    status: 200,
    description: 'Comment added',
  })
  async addComment(
    @Param('caseId') id: string,
    @Body() body: PostCaseComment,
  ): Promise<CaseComment[]> {
    return this.caseService.postComment(id, body)
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
  ): Promise<CaseComment[]> {
    return this.caseService.deleteComment(caseId, commentId)
  }
}
