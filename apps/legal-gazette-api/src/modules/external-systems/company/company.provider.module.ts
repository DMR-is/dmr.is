import { Module } from '@nestjs/common'

import { AdvertProviderModule } from '../../advert/advert.provider.module'
import { CompanyService } from './company.service'
import { ICompanyService } from './company.service.interface'

@Module({
  imports: [AdvertProviderModule],
  controllers: [],
  providers: [
    {
      provide: ICompanyService,
      useClass: CompanyService,
    },
  ],
  exports: [ICompanyService],
})
export class CompanyProviderModule {}
