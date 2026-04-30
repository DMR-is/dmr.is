import {
  Body,
  Controller,
  HttpCode,
  Inject,
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
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { type ReportResourceContext } from '../report/types/report-resource-context'
import { DenyReportDto } from './dto/deny-report.dto'
import { IReportWorkflowService } from './report-workflow.service.interface'

@Controller({
  path: 'reports/:reportId',
  version: '1',
})
@ApiTags('Report Workflow')
@ApiParam({ name: 'reportId', type: String })
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class ReportWorkflowController {
  constructor(
    @Inject(IReportWorkflowService)
    private readonly reportWorkflowService: IReportWorkflowService,
  ) {}

  @Post('assign')
  @HttpCode(204)
  @ApiOperation({ operationId: 'assignReport' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 401, type: ApiErrorDto })
  @ApiResponse({ status: 403, type: ApiErrorDto })
  @ApiResponse({ status: 404, type: ApiErrorDto })
  async assign(
    @CurrentReportResourceContext() context: ReportResourceContext,
  ): Promise<void> {
    return this.reportWorkflowService.assign(context)
  }

  @Post('deny')
  @HttpCode(204)
  @ApiOperation({ operationId: 'denyReport' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 400, type: ApiErrorDto })
  @ApiResponse({ status: 401, type: ApiErrorDto })
  @ApiResponse({ status: 403, type: ApiErrorDto })
  @ApiResponse({ status: 404, type: ApiErrorDto })
  async deny(
    @CurrentReportResourceContext() context: ReportResourceContext,
    @Body() dto: DenyReportDto,
  ): Promise<void> {
    return this.reportWorkflowService.deny(context, dto)
  }

  @Post('approve')
  @HttpCode(204)
  @ApiOperation({ operationId: 'approveReport' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 401, type: ApiErrorDto })
  @ApiResponse({ status: 403, type: ApiErrorDto })
  @ApiResponse({ status: 404, type: ApiErrorDto })
  async approve(
    @CurrentReportResourceContext() context: ReportResourceContext,
  ): Promise<void> {
    return this.reportWorkflowService.approve(context)
  }

  @Post('start-fines')
  @HttpCode(204)
  @ApiOperation({ operationId: 'startReportFines' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 401, type: ApiErrorDto })
  @ApiResponse({ status: 403, type: ApiErrorDto })
  @ApiResponse({ status: 404, type: ApiErrorDto })
  async startFines(
    @CurrentReportResourceContext() context: ReportResourceContext,
  ): Promise<void> {
    return this.reportWorkflowService.startFines(context)
  }
}
