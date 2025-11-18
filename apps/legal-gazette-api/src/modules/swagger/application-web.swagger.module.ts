import { Module } from '@nestjs/common'

import { PublicationControllerModule } from '../advert/publications/publication.controller.module'
import { ApplictionControllerModule } from '../applications/application.controller.module'
import { BaseEntityControllerModule } from '../base-entity/base-entity.controller.module'
import { CaseControllerModule } from '../case/case.controller.module'
import { LGNationalRegistryControllerModule } from '../national-registry/national-registry.controller.module'

@Module({
  imports: [
    BaseEntityControllerModule,
    CaseControllerModule,
    ApplictionControllerModule,
    PublicationControllerModule,
    LGNationalRegistryControllerModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class ApplicationWebSwaggerModule {}
