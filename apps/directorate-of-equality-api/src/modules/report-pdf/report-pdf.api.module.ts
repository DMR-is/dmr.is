import { Module } from '@nestjs/common'

import { AuthorizationCoreModule } from '@dmr.is/doe-modules/authorization'
import { ReportPdfCoreModule } from '@dmr.is/doe-modules/report-pdf'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ReportPdfController } from './report-pdf.controller'

@Module({
  imports: [ReportPdfCoreModule, AuthorizationCoreModule],
  controllers: [ReportPdfController],
  providers: [AdminGuard],
})
export class ReportPdfApiModule {}
