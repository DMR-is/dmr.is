import { Module } from '@nestjs/common'

import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { ReportCreateController } from './report-create.controller'
import { ReportCreateCoreModule } from './report-create.core.module'

@Module({
  imports: [ReportCreateCoreModule],
  controllers: [ReportCreateController],
  providers: [CompanyResourceGuard],
})
export class ReportCreateApiModule {}
