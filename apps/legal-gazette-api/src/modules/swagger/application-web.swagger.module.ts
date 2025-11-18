import { Module } from '@nestjs/common'

import { AdvertProviderModule } from '../advert/advert.provider.module'
import { AdvertController } from '../advert/controllers/advert.controller'
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
    AdvertProviderModule,
    TypeControllerModule,
    CategoryControllerModule,
    StatusControllerModule,
    CourtDistrictControllerModule,
    CaseControllerModule,
    ApplictionControllerModule,
    PublicationControllerModule,
    LGNationalRegistryControllerModule,
  ],
  controllers: [AdvertController],
  providers: [],
  exports: [],
})
export class ApplicationWebSwaggerModule {}
