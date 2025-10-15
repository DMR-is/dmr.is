import { Module } from '@nestjs/common'

import { AdvertModule } from '../advert/advert.module'
import { AdvertPublicationModule } from '../advert-publications/advert-publication.module'
import { ApplicationModule } from '../applications/application.module'
import { BaseEntityModule } from '../base-entity/base-entity.module'
import { CaseModule } from '../case/case.module'

@Module({
  imports: [
    BaseEntityModule,
    CaseModule,
    AdvertModule,
    ApplicationModule,
    AdvertPublicationModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class ApplicationWebModule {}
