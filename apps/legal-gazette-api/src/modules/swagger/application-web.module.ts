import { Module } from '@nestjs/common'

import { AdvertModule } from '../advert/advert.module'
import { ApplicationModule } from '../applications/application.module'
import { BaseEntityModule } from '../base-entity/base-entity.module'
import { CaseModule } from '../case/case.module'

@Module({
  imports: [BaseEntityModule, CaseModule, AdvertModule, ApplicationModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class ApplicationWebModule {}
