import { Module } from '@nestjs/common'

import { AdvertProviderModule } from '../../advert/advert.provider.module'
import { CompanyController } from './company.controller'
import { CompanyProviderModule } from './company.provider.module'

@Module({
  imports: [CompanyProviderModule, AdvertProviderModule],
  controllers: [CompanyController],
})
export class CompanyControllerModule {}
