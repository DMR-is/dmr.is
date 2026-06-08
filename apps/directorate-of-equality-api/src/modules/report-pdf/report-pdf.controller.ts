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
    operationId: 'getSalaryReportPdf',
    include404: true,
    produces: 'application/pdf',
    successDescription:
      'Generates and returns the salary report ("Jafnlaunaúttekt") as a PDF.',
  })
  async getSalaryReportPdf(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Res() res: Response,
  ): Promise<void> {
    const pdf = await this.reportPdfService.generateSalaryReportPdf(reportId)
    this.sendPdf(res, pdf, `launagreining-${reportId}.pdf`)
  }

  @Get('equality')
  @DoeResponse({
    operationId: 'getEqualityReportPdf',
    include404: true,
    produces: 'application/pdf',
    successDescription:
      'Generates and returns the equality report ("Jafnréttisáætlun") as a PDF.',
  })
  async getEqualityReportPdf(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Res() res: Response,
  ): Promise<void> {
    const pdf = await this.reportPdfService.generateEqualityReportPdf(reportId)
    this.sendPdf(res, pdf, `jafnrettisaaetlun-${reportId}.pdf`)
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
