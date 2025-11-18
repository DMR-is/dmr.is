import { Module } from '@nestjs/common'

import { CompanyController } from './company.controller'
import { CompanyProviderModule } from './company.provider.module'

@Module({
  imports: [CompanyProviderModule],
  controllers: [CompanyController],
})
export class CompanyControllerModule {}
