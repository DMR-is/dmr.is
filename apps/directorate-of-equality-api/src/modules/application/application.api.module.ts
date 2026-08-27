import { Module } from '@nestjs/common'

import {
  ApiKeyCoreModule,
  ApplicationCoreModule,
  CompanyCoreModule,
  ImportUploadCoreModule,
  ReportExcelCoreModule,
} from '@dmr.is/doe-modules'

import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { ApplicationController } from './application.controller'

@Module({
  imports: [
    ApplicationCoreModule,
    ApiKeyCoreModule,
    ReportExcelCoreModule,
    CompanyCoreModule,
    ImportUploadCoreModule,
  ],
  controllers: [ApplicationController],
  providers: [CompanyResourceGuard],
})
export class ApplicationApiModule {}
