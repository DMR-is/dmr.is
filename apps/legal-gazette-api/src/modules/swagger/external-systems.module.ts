import { Module } from '@nestjs/common'

import { CompanyModule } from '../company/company.module'

@Module({
  imports: [CompanyModule],
  controllers: [],
  exports: [],
  providers: [],
})
export class ExternalSystemsModule {}
