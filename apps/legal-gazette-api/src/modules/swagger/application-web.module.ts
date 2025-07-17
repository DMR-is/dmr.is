import { Module } from '@nestjs/common'

import { BankruptcyAdvertModule } from '../bankruptcy-advert/bankruptcy-advert.module'
import { BaseEntityModule } from '../base-entity/base-entity.module'
import { CaseModule } from '../case/case.module'

@Module({
  imports: [CaseModule, BankruptcyAdvertModule, BaseEntityModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class ApplicationWebModule {}
