import { Module } from '@nestjs/common'

import {
  CompanyCoreModule,
  ReportDraftCoreModule,
} from '@dmr.is/doe-modules'

import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { ReportDraftController } from './report-draft.controller'

@Module({
  imports: [ReportDraftCoreModule, CompanyCoreModule],
  controllers: [ReportDraftController],
  providers: [CompanyResourceGuard],
})
export class ReportDraftApiModule {}
