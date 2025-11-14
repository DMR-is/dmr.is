import { Module } from '@nestjs/common'

import { CategoryControllerModule } from '../category/category.module'
import { CourtDistrictControllerModule } from '../court-district/court-district.module'
import { StatusControllerModule } from '../status/status.module'
import { TypeControllerModule } from '../type/type.module'

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
