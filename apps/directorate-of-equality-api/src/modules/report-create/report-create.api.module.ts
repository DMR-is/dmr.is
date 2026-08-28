import { Module } from '@nestjs/common'

import { ReportCreateCoreModule } from '@dmr.is/doe-modules/report-create'

import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { ReportCreateController } from './report-create.controller'

@Module({
  imports: [ReportCreateCoreModule],
  controllers: [ReportCreateController],
  providers: [CompanyResourceGuard],
})
export class ReportCreateApiModule {}
