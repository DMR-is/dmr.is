import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'

import { type ReportResourceContext } from '@dmr.is/doe-modules/report'
import {
  AssignReportDto,
  DenyReportDto,
  IReportWorkflowService,
} from '@dmr.is/doe-modules/report-workflow'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CurrentReportResourceContext } from '../../core/decorators/current-report-resource-context.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ReportResourceGuard } from '../../core/guards/report-resource/report-resource.guard'

@Controller({
  path: 'reports/:reportId',
  version: '1',
})
@ApiTags('Report Workflow')
@ApiParam({ name: 'reportId', type: String })
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard, ReportResourceGuard)
export class ReportWorkflowController {
  constructor(
    @Inject(IReportWorkflowService)
    private readonly reportWorkflowService: IReportWorkflowService,
  ) {}

  @Post('assign')
  @HttpCode(204)
  @DoeResponse({ operationId: 'assignReport', include404: true })
  async assign(
    @CurrentReportResourceContext() context: ReportResourceContext,
    @Body() dto: AssignReportDto,
  ): Promise<void> {
    return this.reportWorkflowService.assign(context, dto)
  }

  @Post('deny')
  @HttpCode(204)
  @DoeResponse({ operationId: 'denyReport', include404: true })
  async deny(
    @CurrentReportResourceContext() context: ReportResourceContext,
    @Body() dto: DenyReportDto,
  ): Promise<void> {
    return this.reportWorkflowService.deny(context, dto)
  }

  @Post('approve')
  @HttpCode(204)
  @DoeResponse({ operationId: 'approveReport', include404: true })
  async approve(
    @CurrentReportResourceContext() context: ReportResourceContext,
  ): Promise<void> {
    return this.reportWorkflowService.approve(context)
  }
}
