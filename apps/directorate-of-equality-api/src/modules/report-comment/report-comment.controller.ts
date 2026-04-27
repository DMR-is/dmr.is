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
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { ReportResourceGuard } from '../../core/guards/report-resource/report-resource.guard'
import { CurrentReportResourceContext } from '../report/decorators/current-report-resource-context.decorator'
import { type ReportResourceContext } from '../report/types/report-resource-context'
import { CreateReportCommentDto } from './dto/create-report-comment.dto'
import { ReportCommentDto } from './dto/report-comment.dto'
import { IReportCommentService } from './report-comment.service.interface'

@Controller({
  path: 'reports/:reportId/comments',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, ReportResourceGuard)
export class ReportCommentController {
  constructor(
    @Inject(IReportCommentService)
    private readonly reportCommentService: IReportCommentService,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'getReportComments' })
  @ApiResponse({ status: 200, type: [ReportCommentDto] })
  async getByReportId(
    @CurrentReportResourceContext() context: ReportResourceContext,
  ): Promise<ReportCommentDto[]> {
    return this.reportCommentService.getByReportId(context)
  }

  @Post()
  @ApiOperation({ operationId: 'createReportComment' })
  @ApiResponse({ status: 201, type: ReportCommentDto })
  async create(
    @CurrentReportResourceContext() context: ReportResourceContext,
    @Body() dto: CreateReportCommentDto,
  ): Promise<ReportCommentDto> {
    return this.reportCommentService.create(context, dto)
  }

  @Delete(':commentId')
  @HttpCode(204)
  @ApiOperation({ operationId: 'deleteReportComment' })
  @ApiResponse({ status: 204 })
  async delete(
    @CurrentReportResourceContext() context: ReportResourceContext,
    @Param('commentId') commentId: string,
  ): Promise<void> {
    return this.reportCommentService.delete(context, commentId)
  }
}
