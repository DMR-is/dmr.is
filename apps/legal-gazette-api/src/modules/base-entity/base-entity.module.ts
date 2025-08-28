import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CategoryController } from '../category/category.controller'
import { CategoryModel } from '../category/category.model'
import { CourtDistrictController } from '../court-district/court-district.controller'
import { CourtDistrictModel } from '../court-district/court-district.model'
import { StatusController } from '../status/status.controller'
import { StatusModel } from '../status/status.model'
import { TypeController } from '../type/type.controller'
import { TypeModel } from '../type/type.model'

// To wrap all the base entity controllers
@Module({
  imports: [
    SequelizeModule.forFeature([
      TypeModel,
      CategoryModel,
      StatusModel,
      CourtDistrictModel,
    ]),
  ],
  controllers: [
    TypeController,
    CategoryController,
    StatusController,
    CourtDistrictController,
  ],
  providers: [],
  exports: [],
})
export class BaseEntityModule {}
