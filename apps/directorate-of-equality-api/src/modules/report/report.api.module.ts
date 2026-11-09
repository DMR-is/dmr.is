import { Module } from '@nestjs/common'

import { AuthorizationCoreModule } from '@dmr.is/doe-modules/authorization'
import { ReportCoreModule } from '@dmr.is/doe-modules/report'
import { ReportAttachmentCoreModule } from '@dmr.is/doe-modules/report-attachment'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ReportController } from './report.controller'

@Module({
  imports: [
    ReportCoreModule,
    ReportAttachmentCoreModule,
    AuthorizationCoreModule,
  ],
  controllers: [ReportController],
  providers: [AdminGuard],
})
export class ReportApiModule {}
