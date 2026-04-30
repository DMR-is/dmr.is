import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CurrentReportResourceContext } from '../../core/decorators/current-report-resource-context.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
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
  @DoeResponse({ operationId: 'assignReport', errors: [400, 401, 403, 404, 500] })
  async assign(
    @CurrentReportResourceContext() context: ReportResourceContext,
  ): Promise<void> {
    return this.reportWorkflowService.assign(context)
  }

  @Post('deny')
  @HttpCode(204)
  @DoeResponse({ operationId: 'denyReport', errors: [400, 401, 403, 404, 500] })
  async deny(
    @CurrentReportResourceContext() context: ReportResourceContext,
    @Body() dto: DenyReportDto,
  ): Promise<void> {
    return this.reportWorkflowService.deny(context, dto)
  }

  @Post('approve')
  @HttpCode(204)
  @DoeResponse({ operationId: 'approveReport', errors: [400, 401, 403, 404, 500] })
  async approve(
    @CurrentReportResourceContext() context: ReportResourceContext,
  ): Promise<void> {
    return this.reportWorkflowService.approve(context)
  }

  @Post('start-fines')
  @HttpCode(204)
  @DoeResponse({ operationId: 'startReportFines', errors: [400, 401, 403, 404, 500] })
  async startFines(
    @CurrentReportResourceContext() context: ReportResourceContext,
  ): Promise<void> {
    return this.reportWorkflowService.startFines(context)
  }
}
