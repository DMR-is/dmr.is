import { Module } from '@nestjs/common'

import { CompanyCoreModule } from '@dmr.is/doe-modules/company'
import { PartnerClientCoreModule } from '@dmr.is/doe-modules/partner-client'

import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { PartnerClientResourceGuard } from '../../core/guards/partner-client-resource/partner-client-resource.guard'
import { ApplicationPartnerController } from './application-partner.controller'
import { ApplicationPartnerClientController } from './application-partner-client.controller'

/**
 * `CompanyCoreModule` is required: `CompanyResourceGuard` injects
 * `ICompanyService`. Mirrors `ApplicationApiModule`.
 */
@Module({
  imports: [PartnerClientCoreModule, CompanyCoreModule],
  controllers: [
    ApplicationPartnerController,
    ApplicationPartnerClientController,
  ],
  providers: [CompanyResourceGuard, PartnerClientResourceGuard],
})
export class ApplicationPartnerApiModule {}
