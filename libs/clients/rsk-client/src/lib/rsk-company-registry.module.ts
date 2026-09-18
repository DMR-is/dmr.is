import { Module } from '@nestjs/common'

import { RskCompanyRegistryService } from './rsk-company-registry.service'
import { IRskCompanyRegistryService } from './rsk-company-registry.service.interface'

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: IRskCompanyRegistryService,
      useClass: RskCompanyRegistryService,
    },
  ],
  exports: [IRskCompanyRegistryService],
})
export class RskCompanyRegistryModule {}
