import { Module } from '@nestjs/common'

import { AdvertProviderModule } from '../advert/advert.provider.module'
import { CompanyController } from './company.controller'
import { CompanyService } from './company.service'
import { ICompanyService } from './company.service.interface'

@Module({
  imports: [AdvertProviderModule],
  controllers: [CompanyController],
  providers: [
    {
      provide: ICompanyService,
      useClass: CompanyService,
    },
  ],
  exports: [],
})
export class CompanyModule {}
