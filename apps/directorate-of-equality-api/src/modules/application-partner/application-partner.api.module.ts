import { Module } from '@nestjs/common'

import { CompanyCoreModule } from '@dmr.is/doe-modules/company'
import { PartnerClientCoreModule } from '@dmr.is/doe-modules/partner-client'

import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { ApplicationPartnerController } from './application-partner.controller'

/**
 * `CompanyCoreModule` is required: `CompanyResourceGuard` injects
 * `ICompanyService`. Mirrors `ApplicationApiModule`.
 */
@Module({
  imports: [PartnerClientCoreModule, CompanyCoreModule],
  controllers: [ApplicationPartnerController],
  providers: [CompanyResourceGuard],
})
export class ApplicationPartnerApiModule {}
