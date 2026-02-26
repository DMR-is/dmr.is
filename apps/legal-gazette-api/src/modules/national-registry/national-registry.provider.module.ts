import { Module } from '@nestjs/common'

import { NationalRegistryModule } from '@dmr.is/clients-national-registry'

import { LGNationalRegistryService } from './national-registry.service'
import { ILGNationalRegistryService } from './national-registry.service.interface'

@Module({
  imports: [NationalRegistryModule],
  providers: [
    {
      provide: ILGNationalRegistryService,
      useClass: LGNationalRegistryService,
    },
  ],
  exports: [ILGNationalRegistryService],
})
export class LGNationalRegistryProviderModule {}
