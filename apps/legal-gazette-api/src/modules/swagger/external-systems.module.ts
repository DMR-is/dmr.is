import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'

import { CompanyModule } from '../company/company.module'
import { ForeclosureModule } from '../foreclosure/foreclosure.module'

@Module({
  imports: [
    CompanyModule,
    ForeclosureModule,
    RouterModule.register([
      {
        path: 'external',
        module: CompanyModule,
      },
      {
        path: 'external',
        module: ForeclosureModule,
      },
    ]),
  ],
  controllers: [],
  exports: [],
  providers: [],
})
export class ExternalSystemsModule {}
