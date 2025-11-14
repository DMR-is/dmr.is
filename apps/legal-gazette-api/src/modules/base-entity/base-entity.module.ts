import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CategoryModel } from '../../models/category.model'
import { CourtDistrictModel } from '../../models/court-district.model'
import { StatusModel } from '../../models/status.model'
import { TypeModel } from '../../models/type.model'
import { CategoryController } from '../category/category.controller'
import { CourtDistrictController } from '../court-district/court-district.controller'
import { StatusController } from '../status/status.controller'
import { TypeController } from '../type/type.controller'

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
export class BaseEntityControllerModule {}
