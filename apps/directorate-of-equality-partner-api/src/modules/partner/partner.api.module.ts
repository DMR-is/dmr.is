import { Module } from '@nestjs/common'

import {
  ApplicationCoreModule,
  EXTERNAL_PROVIDER_CHANNEL,
} from '@dmr.is/doe-modules/application'
import { CompanyCoreModule } from '@dmr.is/doe-modules/company'
import { ImportUploadCoreModule } from '@dmr.is/doe-modules/import-upload'
import { ReportExcelCoreModule } from '@dmr.is/doe-modules/report-excel'

import { ApiKeyCoreModule } from '../api-key/api-key.core.module'
import { PartnerController } from './partner.controller'

/**
 * `EXTERNAL_PROVIDER_CHANNEL` is the whole reason this module differs from its
 * island.is counterpart: it stamps submissions as `OTHER` and namespaces
 * `provider_id` with the authenticated company's kennitala. Everything else
 * behind the controller is the same code the island.is surface runs.
 */
@Module({
  imports: [
    ApplicationCoreModule.forChannel(EXTERNAL_PROVIDER_CHANNEL),
    ReportExcelCoreModule,
    CompanyCoreModule,
    ImportUploadCoreModule,
    ApiKeyCoreModule,
  ],
  controllers: [PartnerController],
})
export class PartnerApiModule {}
