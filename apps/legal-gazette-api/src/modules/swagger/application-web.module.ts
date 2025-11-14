import { Module } from '@nestjs/common'

import { AdvertProviderModule } from '../advert/advert.provider.module'
import { ApplictionControllerModule } from '../applications/application.module'
import { BaseEntityControllerModule } from '../base-entity/base-entity.module'
import { CaseControllerModule } from '../case/case.module'
import { LGNationalRegistryModule } from '../national-registry/national-registry.module'
import { AdvertPublicationControllerModule } from '../publications/publication.module'

@Module({
  imports: [
    AdvertProviderModule,
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
