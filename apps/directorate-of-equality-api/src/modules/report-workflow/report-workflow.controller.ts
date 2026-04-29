import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ReportResourceGuard } from '../../core/guards/report-resource/report-resource.guard'
import { CurrentReportResourceContext } from '../report/decorators/current-report-resource-context.decorator'
import { type ReportResourceContext } from '../report/types/report-resource-context'
import { DenyReportDto } from './dto/deny-report.dto'
import { IReportWorkflowService } from './report-workflow.service.interface'

@Controller({
  path: 'reports/:reportId',
  version: '1',
})
@ApiTags('Report Workflow')
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
  async assign(
    @CurrentReportResourceContext() context: ReportResourceContext,
  ): Promise<void> {
    return this.reportWorkflowService.assign(context)
  }

  @Post('deny')
  @HttpCode(204)
  @ApiOperation({ operationId: 'denyReport' })
  @ApiResponse({ status: 204 })
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
  async approve(
    @CurrentReportResourceContext() context: ReportResourceContext,
  ): Promise<void> {
    return this.reportWorkflowService.approve(context)
  }

  @Post('start-fines')
  @HttpCode(204)
  @ApiOperation({ operationId: 'startReportFines' })
  @ApiResponse({ status: 204 })
  async startFines(
    @CurrentReportResourceContext() context: ReportResourceContext,
  ): Promise<void> {
    return this.reportWorkflowService.startFines(context)
  }
}
