import {
  AdvertCategoryCategoriesModel,
  AdvertCategoryModel,
  AdvertMainCategoryModel,
} from '@dmr.is/official-journal/models'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CategoryController } from './controllers/category.controller'
import { CategoryService } from './category.service'
import { ICategoryService } from './category.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      AdvertCategoryModel,
      AdvertMainCategoryModel,
      AdvertCategoryCategoriesModel,
    ]),
  ],
  controllers: [CategoryController],
  providers: [
    {
      provide: ICategoryService,
      useClass: CategoryService,
    },
  ],
  exports: [ICategoryService],
})
export class CategoryModule {}
