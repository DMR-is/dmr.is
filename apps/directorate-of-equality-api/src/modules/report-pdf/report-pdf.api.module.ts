import { Module } from '@nestjs/common'

import {
  AuthorizationCoreModule,
  ReportPdfCoreModule,
} from '@dmr.is/doe-modules'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ReportPdfController } from './report-pdf.controller'

@Module({
  imports: [ReportPdfCoreModule, AuthorizationCoreModule],
  controllers: [ReportPdfController],
  providers: [AdminGuard],
})
export class ReportPdfApiModule {}
