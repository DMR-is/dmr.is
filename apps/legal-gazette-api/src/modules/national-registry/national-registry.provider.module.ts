import { Module } from '@nestjs/common'

import { CompanyRegistryClientModule } from '@dmr.is/clients/company-registry'
import { NationalRegistryModule } from '@dmr.is/clients/national-registry'

import { LGNationalRegistryService } from './national-registry.service'
import { ILGNationalRegistryService } from './national-registry.service.interface'

@Module({
  imports: [NationalRegistryModule, CompanyRegistryClientModule],
  providers: [
    {
      provide: ILGNationalRegistryService,
      useClass: LGNationalRegistryService,
    },
  ],
  exports: [ILGNationalRegistryService],
})
export class LGNationalRegistryProviderModule {}
