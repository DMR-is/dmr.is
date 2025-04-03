import {
  AdvertCategoryCategoriesModel,
  AdvertCategoryModel,
  AdvertMainCategoryModel,
} from '@dmr.is/official-journal/models'
import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { CategoryController } from './controllers/category.controller'
import { ICategoryService } from './category.service.interface'
import { CategoryService } from './category.service'

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
