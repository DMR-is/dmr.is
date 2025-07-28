import { Module } from '@nestjs/common'

import { BankruptcyApplicationModule } from '../applications/bankruptcy/bankruptcy-application.module'
import { BankruptcyAdvertModule } from '../bankruptcy-advert/bankruptcy-advert.module'
import { BaseEntityModule } from '../base-entity/base-entity.module'
import { CaseModule } from '../case/case.module'

@Module({
  imports: [
    CaseModule,
    BankruptcyAdvertModule,
    BankruptcyApplicationModule,
    BaseEntityModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class ApplicationWebModule {}
