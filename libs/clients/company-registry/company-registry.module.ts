import { Module } from '@nestjs/common'
import { ICompanyRegistryClientService } from './company-registry.service.interface'
import { CompanyRegistryClientService } from './company-regsitry.service'

@Module({
  imports: [],
  providers: [
    {
      provide: ICompanyRegistryClientService,
      useClass: CompanyRegistryClientService,
    },
  ],
  exports: [ICompanyRegistryClientService],
})
export class CompanyRegistryClientModule {}
