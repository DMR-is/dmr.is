import { Module } from '@nestjs/common'

import {
  AuthorizationCoreModule,
  ReportCoreModule,
} from '@dmr.is/doe-modules'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ReportController } from './report.controller'

@Module({
  imports: [ReportCoreModule, AuthorizationCoreModule],
  controllers: [ReportController],
  providers: [AdminGuard],
})
export class ReportApiModule {}
