import { Module } from '@nestjs/common'

import { LoggingModule } from '@dmr.is/logging'

import { NationalRegistryService } from './national-registry.service'
import { INationalRegistryService } from './national-registry.service.interface'

@Module({
  imports: [LoggingModule],
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
