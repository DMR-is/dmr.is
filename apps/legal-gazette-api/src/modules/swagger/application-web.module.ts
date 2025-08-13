import { Module } from '@nestjs/common'

import { AdvertModule } from '../advert/advert.module'
import { ApplicationModule } from '../applications/application.module'
import { BankruptcyApplicationModule } from '../applications/recall/recall-application.module'
import { BaseEntityModule } from '../base-entity/base-entity.module'
import { CaseModule } from '../case/case.module'

@Module({
  imports: [
    CaseModule,
    AdvertModule,
    BankruptcyApplicationModule,
    BaseEntityModule,
    ApplicationModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class ApplicationWebModule {}
