import { Module } from '@nestjs/common'

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
