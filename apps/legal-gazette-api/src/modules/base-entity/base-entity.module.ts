import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CategoryController } from '../category/category.controller'
import { CategoryModel } from '../../models/category.model'
import { CourtDistrictController } from '../court-district/court-district.controller'
import { CourtDistrictModel } from '../../models/court-district.model'
import { StatusController } from '../status/status.controller'
import { StatusModel } from '../../models/status.model'
import { TypeController } from '../type/type.controller'
import { TypeModel } from '../../models/type.model'

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
