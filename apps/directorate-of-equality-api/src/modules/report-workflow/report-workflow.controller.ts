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
import { ReportResourceGuard } from '../../core/guards/report-resource/report-resource.guard'
import { type ReportResourceContext } from '../report/types/report-resource-context'
import { AssignReportDto } from './dto/assign-report.dto'
import { DenyReportDto } from './dto/deny-report.dto'
import { SendToEditDto } from './dto/send-to-edit.dto'
import { IReportWorkflowService } from './report-workflow.service.interface'

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

  @Post('send-to-edit')
  @HttpCode(204)
  @DoeResponse({ operationId: 'sendReportToEdit', include404: true })
  async sendToEdit(
    @CurrentReportResourceContext() context: ReportResourceContext,
    @Body() dto: SendToEditDto,
  ): Promise<void> {
    return this.reportWorkflowService.sendToEdit(context, dto)
  }

  @Post('communication/open')
  @HttpCode(204)
  @DoeResponse({ operationId: 'openReportCommunication', include404: true })
  async openCommunication(
    @CurrentReportResourceContext() context: ReportResourceContext,
  ): Promise<void> {
    return this.reportWorkflowService.openCommunication(context)
  }

  @Post('communication/close')
  @HttpCode(204)
  @DoeResponse({ operationId: 'closeReportCommunication', include404: true })
  async closeCommunication(
    @CurrentReportResourceContext() context: ReportResourceContext,
  ): Promise<void> {
    return this.reportWorkflowService.closeCommunication(context)
  }
}
