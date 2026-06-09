import { Response } from 'express'

import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { IReportPdfService } from './report-pdf.service.interface'

@Controller({ path: 'reports/:reportId/pdf', version: '1' })
@ApiTags('Report PDF')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class ReportPdfController {
  constructor(
    @Inject(IReportPdfService)
    private readonly reportPdfService: IReportPdfService,
  ) {}

  @Get()
  @DoeResponse({
    operationId: 'getReportPdf',
    include404: true,
    produces: 'application/pdf',
    successDescription:
      'Generates and returns the report as a PDF. The layout ' +
      '("Jafnlaunaúttekt" or "Jafnréttisáætlun") is chosen from the report type.',
  })
  async getReportPdf(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { pdf, fileName } =
      await this.reportPdfService.generateReportPdf(reportId)
    this.sendPdf(res, pdf, fileName)
  }

  private sendPdf(res: Response, pdf: Buffer, fileName: string): void {
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Content-Length': pdf.length,
    })
    res.send(pdf)
  }
}
