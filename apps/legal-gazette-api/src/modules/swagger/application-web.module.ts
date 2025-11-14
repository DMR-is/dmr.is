import { Module } from '@nestjs/common'

import { AdvertModule } from '../../services/advert/advert.module'
import { AdvertPublicationControllerModule } from '../advert-publications/advert-publication.module'
import { ApplictionControllerModule } from '../applications/application.module'
import { BaseEntityControllerModule } from '../base-entity/base-entity.module'
import { CaseControllerModule } from '../case/case.module'
import { LGNationalRegistryModule } from '../national-registry/national-registry.module'

@Module({
  imports: [
    AdvertModule,
    BaseEntityControllerModule,
    CaseControllerModule,
    ApplictionControllerModule,
    AdvertPublicationControllerModule,
    LGNationalRegistryModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class ApplicationWebModule {}
