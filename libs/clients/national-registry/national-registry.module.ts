import { Module } from '@nestjs/common'
import { INationalRegistryService } from './national-registry.service.interface'
import { NationalRegistryService } from './national-registry.service'

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
