import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CategoryController } from './category.controller'
import { CategoryModel } from './category.model'
import { CategoryService } from './category.service'
import { ICategoryService } from './category.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([CategoryModel])],
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
