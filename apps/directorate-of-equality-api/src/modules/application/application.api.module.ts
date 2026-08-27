import { Module } from '@nestjs/common'

import { ApiKeyCoreModule } from '@dmr.is/doe-modules/api-key'
import {
  ApplicationCoreModule,
  ISLAND_IS_PROVIDER_CHANNEL,
} from '@dmr.is/doe-modules/application'
import { CompanyCoreModule } from '@dmr.is/doe-modules/company'
import { ImportUploadCoreModule } from '@dmr.is/doe-modules/import-upload'
import { ReportExcelCoreModule } from '@dmr.is/doe-modules/report-excel'

import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { ApplicationController } from './application.controller'

@Module({
  imports: [
    ApplicationCoreModule.forChannel(ISLAND_IS_PROVIDER_CHANNEL),
    ApiKeyCoreModule,
    ReportExcelCoreModule,
    CompanyCoreModule,
    ImportUploadCoreModule,
  ],
  controllers: [ApplicationController],
  providers: [CompanyResourceGuard],
})
export class ApplicationApiModule {}
