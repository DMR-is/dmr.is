import { Module } from '@nestjs/common'

import { ReportPdfDownloadGate } from './report-pdf-download-gate.service'
import { IReportPdfDownloadGate } from './report-pdf-download-gate.service.interface'

/**
 * The concurrency limit on applicant-facing report PDF downloads.
 *
 * Separate from `ReportPdfCoreModule` so only the routes that want the limit
 * get it: the admin preview and the notice dispatcher render outside it. The
 * dispatcher sends an approval without its attachment when a render fails, so
 * a shared limit that sheds would cost companies their approval documents.
 *
 * One gate per process: Nest shares a static module's providers across every
 * import, so importing this module elsewhere puts that caller into this same
 * limit. A caller that needs its own budget needs its own gate.
 */
@Module({
  providers: [
    { provide: IReportPdfDownloadGate, useClass: ReportPdfDownloadGate },
  ],
  exports: [IReportPdfDownloadGate],
})
export class ReportPdfDownloadGateCoreModule {}
