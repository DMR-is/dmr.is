import { Module } from '@nestjs/common'

import { ApiKeyCoreModule } from '@dmr.is/doe-modules/api-key'
import { CompanyCoreModule } from '@dmr.is/doe-modules/company'
import { PartnerClientCoreModule } from '@dmr.is/doe-modules/partner-client'

import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { PartnerClientResourceGuard } from '../../core/guards/partner-client-resource/partner-client-resource.guard'
import { ApplicationApiKeyController } from './application-api-key.controller'
import { ApplicationPartnerController } from './application-partner.controller'
import { ApplicationPartnerClientController } from './application-partner-client.controller'

/**
 * The self-service web's routes: consent, a provider's own keys, and a
 * company's own keys.
 *
 * `CompanyCoreModule` is required: `CompanyResourceGuard` injects
 * `ICompanyService`. Mirrors `ApplicationApiModule`.
 */
@Module({
  imports: [PartnerClientCoreModule, CompanyCoreModule, ApiKeyCoreModule],
  controllers: [
    ApplicationApiKeyController,
    ApplicationPartnerController,
    ApplicationPartnerClientController,
  ],
  providers: [CompanyResourceGuard, PartnerClientResourceGuard],
})
export class ApplicationPartnerApiModule {}
