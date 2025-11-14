import { Module } from '@nestjs/common'

import { AdvertProviderModule } from '../advert/advert.provider.module'
import { ApplictionControllerModule } from '../applications/application.controller.module'
import { BaseEntityControllerModule } from '../base-entity/base-entity.controller.module'
import { CaseControllerModule } from '../case/case.controller.module'
import { LGNationalRegistryControllerModule } from '../national-registry/national-registry.controller.module'
import { AdvertPublicationControllerModule } from '../publications/publication.controller.module'

@Module({
  imports: [
    AdvertProviderModule,
    BaseEntityControllerModule,
    CaseControllerModule,
    ApplictionControllerModule,
    AdvertPublicationControllerModule,
    LGNationalRegistryControllerModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class ApplicationWebModule {}
