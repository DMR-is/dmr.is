import { Module } from '@nestjs/common'

import { NationalRegistryService } from './national-registry.service'
import { INationalRegistryService } from './national-registry.service.interface'

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: INationalRegistryService,
      useClass: NationalRegistryService,
    },
  ],
  exports: [INationalRegistryService],
})
export class NationalRegistryModule {}
