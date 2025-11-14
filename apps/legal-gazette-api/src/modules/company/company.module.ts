import { Module } from '@nestjs/common'

import { AdvertModule } from '../../services/advert/advert.module'
import { CompanyController } from './company.controller'
import { CompanyService } from './company.service'
import { ICompanyService } from './company.service.interface'

@Module({
  imports: [AdvertModule],
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
