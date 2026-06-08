import { Module } from '@nestjs/common'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { AuthorizationCoreModule } from '../authorization/authorization.core.module'
import { ReportPdfController } from './report-pdf.controller'
import { ReportPdfCoreModule } from './report-pdf.core.module'

@Module({
  imports: [ReportPdfCoreModule, AuthorizationCoreModule],
  controllers: [ReportPdfController],
  providers: [AdminGuard],
})
export class ReportPdfApiModule {}
