import { Response } from 'express'

import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { IReportPdfService } from '@dmr.is/doe-modules/report-pdf'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'

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

  /**
   * The úrbótaáætlun, as the separate document the approval email attaches.
   *
   * Its own route rather than a query flag on the one above: they are two
   * documents with different content, and an admin needs to be able to see
   * exactly what the company receives before approving.
   *
   * Deliberately not gated on report status. `generateImprovementPlanPdf` reads
   * the groups as they stand, which is what a reviewer wants while the report is
   * still IN_REVIEW. Drafts never reach here — `ReportService` filters them out
   * of every admin list, even when a status filter explicitly asks for them.
   */
  @Get('urbotaaetlun')
  @DoeResponse({
    operationId: 'getReportImprovementPlanPdf',
    include404: true,
    produces: 'application/pdf',
    successDescription:
      'Generates and returns the úrbótaáætlun ("Dagsetning úrbóta" and the ' +
      'lágmarksmengi grouped by the groups the company defined) as a PDF. ' +
      'Salary reports only — 400 for an equality report, which has no outlier ' +
      'groups, and 404 when the report has no groups at all (a compliant ' +
      'company has no plan, and its salary report states that as a finding).',
  })
  async getImprovementPlanPdf(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Res() res: Response,
  ): Promise<void> {
    const result =
      await this.reportPdfService.generateImprovementPlanPdf(reportId)

    // Null means no outlier groups — no plan exists to serve, as opposed to a
    // plan that failed to render.
    if (!result) {
      throw new NotFoundException(
        `Report "${reportId}" has no improvement plan`,
      )
    }

    this.sendPdf(res, result.pdf, result.fileName)
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
