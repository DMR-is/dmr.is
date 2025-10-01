import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'

import { CompanyModule } from '../company/company.module'

@Module({
  imports: [
    CompanyModule,
    RouterModule.register([
      {
        path: 'external',
        module: CompanyModule,
      },
    ]),
  ],
  controllers: [],
  exports: [],
  providers: [],
})
export class ExternalSystemsModule {}
