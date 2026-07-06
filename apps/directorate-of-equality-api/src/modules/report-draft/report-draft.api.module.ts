import { Module } from '@nestjs/common'

import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { CompanyCoreModule } from '../company/company.core.module'
import { ReportDraftController } from './report-draft.controller'
import { ReportDraftCoreModule } from './report-draft.core.module'

@Module({
  imports: [ReportDraftCoreModule, CompanyCoreModule],
  controllers: [ReportDraftController],
  providers: [CompanyResourceGuard],
})
export class ReportDraftApiModule {}
