import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CurrentReportResourceContext } from '../../core/decorators/current-report-resource-context.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { ReportResourceGuard } from '../../core/guards/report-resource/report-resource.guard'
import { type ReportResourceContext } from '../report/types/report-resource-context'
import { CreateReportCommentDto } from './dto/create-report-comment.dto'
import { ReportCommentDto } from './dto/report-comment.dto'
import { IReportCommentService } from './report-comment.service.interface'

@Controller({
  path: 'reports/:reportId/comments',
  version: '1',
})
@ApiTags('Report Comments')
@ApiParam({ name: 'reportId', type: String })
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, ReportResourceGuard)
export class ReportCommentController {
  constructor(
    @Inject(IReportCommentService)
    private readonly reportCommentService: IReportCommentService,
  ) {}

  @Get()
  @DoeResponse({
    operationId: 'getReportComments',
    type: [ReportCommentDto],
    errors: [400, 401, 403, 404, 500],
  })
  async getByReportId(
    @CurrentReportResourceContext() context: ReportResourceContext,
  ): Promise<ReportCommentDto[]> {
    return this.reportCommentService.getByReportId(context)
  }

  @Post()
  @DoeResponse({
    operationId: 'createReportComment',
    status: 201,
    type: ReportCommentDto,
    errors: [400, 401, 403, 404, 500],
  })
  async create(
    @CurrentReportResourceContext() context: ReportResourceContext,
    @Body() dto: CreateReportCommentDto,
  ): Promise<ReportCommentDto> {
    return this.reportCommentService.create(context, dto)
  }

  @Delete(':commentId')
  @HttpCode(204)
  @ApiParam({ name: 'commentId', type: String })
  @DoeResponse({ operationId: 'deleteReportComment', errors: [400, 401, 403, 404, 500] })
  async delete(
    @CurrentReportResourceContext() context: ReportResourceContext,
    @Param('commentId') commentId: string,
  ): Promise<void> {
    return this.reportCommentService.delete(context, commentId)
  }
}
