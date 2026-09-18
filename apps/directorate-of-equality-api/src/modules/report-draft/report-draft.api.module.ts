import { Module } from '@nestjs/common'

import { CompanyCoreModule } from '@dmr.is/doe-modules/company'
import { ReportDraftCoreModule } from '@dmr.is/doe-modules/report-draft'

import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { ReportDraftController } from './report-draft.controller'

@Module({
  imports: [ReportDraftCoreModule, CompanyCoreModule],
  controllers: [ReportDraftController],
  providers: [CompanyResourceGuard],
})
export class ReportDraftApiModule {}
