import { Module } from '@nestjs/common'

import { AdvertControllerModule } from '../advert/advert.controller.module'
import { PublicationControllerModule } from '../advert/publications/publication.controller.module'
import { ApplictionControllerModule } from '../applications/application.controller.module'
import { CategoryControllerModule } from '../base-entity/category/category.controller.module'
import { CourtDistrictControllerModule } from '../base-entity/court-district/court-district.controller.module'
import { StatusControllerModule } from '../base-entity/status/status.controller.module'
import { TypeControllerModule } from '../base-entity/type/type.controller.module'
import { CaseControllerModule } from '../case/case.controller.module'
import { LGNationalRegistryControllerModule } from '../national-registry/national-registry.controller.module'

@Module({
  imports: [
    AdvertControllerModule,
    TypeControllerModule,
    CategoryControllerModule,
    StatusControllerModule,
    CourtDistrictControllerModule,
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
