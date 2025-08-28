import { Module } from '@nestjs/common'

import { AdvertModule } from '../advert/advert.module'
import { ApplicationModule } from '../applications/application.module'
import { CommonApplicationModule } from '../applications/common/dmr/common-application.module'
import { RecallApplicationModule } from '../applications/recall/recall-application.module'
import { BaseEntityModule } from '../base-entity/base-entity.module'
import { CaseModule } from '../case/case.module'

@Module({
  imports: [
    BaseEntityModule,
    CaseModule,
    AdvertModule,
    ApplicationModule,
    CommonApplicationModule,
    RecallApplicationModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class ApplicationWebModule {}
