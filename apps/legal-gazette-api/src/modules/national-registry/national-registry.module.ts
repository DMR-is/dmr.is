import { Module } from '@nestjs/common'

import { NationalRegistryModule } from '@dmr.is/clients/national-registry'

import { LGNationalRegistryController } from './national-registry.controller'
import { LGNationalRegistryService } from './national-registry.service'
import { ILGNationalRegistryService } from './national-registry.service.interface'

@Module({
  imports: [NationalRegistryModule],
  controllers: [LGNationalRegistryController],
  providers: [
    {
      provide: ILGNationalRegistryService,
      useClass: LGNationalRegistryService,
    },
  ],
  exports: [ILGNationalRegistryService],
})
export class LGNationalRegistryModule {}
