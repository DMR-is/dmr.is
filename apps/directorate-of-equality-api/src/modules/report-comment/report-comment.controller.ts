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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

import { ApiErrorDto } from '@dmr.is/shared-dto'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CurrentReportResourceContext } from '../../core/decorators/current-report-resource-context.decorator'
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
  @ApiOperation({ operationId: 'getReportComments' })
  @ApiResponse({ status: 200, type: [ReportCommentDto] })
  @ApiResponse({ status: 401, type: ApiErrorDto })
  @ApiResponse({ status: 403, type: ApiErrorDto })
  @ApiResponse({ status: 404, type: ApiErrorDto })
  async getByReportId(
    @CurrentReportResourceContext() context: ReportResourceContext,
  ): Promise<ReportCommentDto[]> {
    return this.reportCommentService.getByReportId(context)
  }

  @Post()
  @ApiOperation({ operationId: 'createReportComment' })
  @ApiResponse({ status: 201, type: ReportCommentDto })
  @ApiResponse({ status: 400, type: ApiErrorDto })
  @ApiResponse({ status: 401, type: ApiErrorDto })
  @ApiResponse({ status: 403, type: ApiErrorDto })
  @ApiResponse({ status: 404, type: ApiErrorDto })
  async create(
    @CurrentReportResourceContext() context: ReportResourceContext,
    @Body() dto: CreateReportCommentDto,
  ): Promise<ReportCommentDto> {
    return this.reportCommentService.create(context, dto)
  }

  @Delete(':commentId')
  @HttpCode(204)
  @ApiOperation({ operationId: 'deleteReportComment' })
  @ApiParam({ name: 'commentId', type: String })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 401, type: ApiErrorDto })
  @ApiResponse({ status: 403, type: ApiErrorDto })
  @ApiResponse({ status: 404, type: ApiErrorDto })
  async delete(
    @CurrentReportResourceContext() context: ReportResourceContext,
    @Param('commentId') commentId: string,
  ): Promise<void> {
    return this.reportCommentService.delete(context, commentId)
  }
}
