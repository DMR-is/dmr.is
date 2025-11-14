import { Module } from '@nestjs/common'

import { CategoryControllerModule } from './category/category.controller.module'
import { CourtDistrictControllerModule } from './court-district/court-district.controller.module'
import { StatusControllerModule } from './status/status.controller.module'
import { TypeControllerModule } from './type/type.controller.module'

// To wrap all the base entity controllers
@Module({
  imports: [
    CourtDistrictControllerModule,
    TypeControllerModule,
    CategoryControllerModule,
    StatusControllerModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class BaseEntityControllerModule {}
