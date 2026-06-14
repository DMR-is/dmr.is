import { Module } from '@nestjs/common'

import { ReportCoreModule } from '../report/report.core.module'
import { ReportStatisticsCoreModule } from '../report-statistics/report-statistics.core.module'
import { ReportPdfService } from './report-pdf.service'
import { IReportPdfService } from './report-pdf.service.interface'

/**
 * Provides the PDF generation service. Kept separate from the API module so
 * both the internal (admin) and application (company-facing) surfaces can
 * import this and reuse `IReportPdfService` without duplicating wiring.
 */
@Module({
  imports: [ReportCoreModule, ReportStatisticsCoreModule],
  providers: [
    {
      provide: IReportPdfService,
      useClass: ReportPdfService,
    },
  ],
  exports: [IReportPdfService],
})
export class ReportPdfCoreModule {}
