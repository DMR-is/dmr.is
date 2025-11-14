import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'

import { CompanyControllerModule } from '../external-systems/company/company.controller.module'
import { ForeclosureControllerModule } from '../external-systems/foreclosure/foreclosure.controller.module'

@Module({
  imports: [
    CompanyControllerModule,
    ForeclosureControllerModule,
    RouterModule.register([
      {
        path: 'external',
        module: CompanyControllerModule,
      },
      {
        path: 'external',
        module: ForeclosureControllerModule,
      },
    ]),
  ],
  controllers: [],
  exports: [],
  providers: [],
})
export class ExternalSystemsSwaggerModule {}
