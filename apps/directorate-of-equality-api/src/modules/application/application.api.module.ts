import { Module } from '@nestjs/common'

import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { CompanyCoreModule } from '../company/company.core.module'
import { ReportExcelCoreModule } from '../report-excel/report-excel.core.module'
import { ApplicationController } from './application.controller'
import { ApplicationCoreModule } from './application.core.module'

@Module({
  imports: [ApplicationCoreModule, ReportExcelCoreModule, CompanyCoreModule],
  controllers: [ApplicationController],
  providers: [CompanyResourceGuard],
})
export class ApplicationApiModule {}
