import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../models/advert.model'
import { CategoryModel } from '../../models/category.model'
import { CategoryTypeChangeLogModel } from '../../models/category-type-change-log.model'
import { TypeModel } from '../../models/type.model'
import { TypeCategoriesModel } from '../../models/type-categories.model'
import { CategoryTypeAdminService } from './category-type-admin.service'
import { ICategoryTypeAdminService } from './category-type-admin.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      CategoryModel,
      TypeModel,
      TypeCategoriesModel,
      AdvertModel,
      CategoryTypeChangeLogModel,
    ]),
  ],
  providers: [
    {
      provide: ICategoryTypeAdminService,
      useClass: CategoryTypeAdminService,
    },
  ],
  exports: [ICategoryTypeAdminService],
})
export class CategoryTypeAdminProviderModule {}
