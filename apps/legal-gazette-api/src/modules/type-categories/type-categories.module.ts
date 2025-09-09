import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CategoryModel } from '../category/category.model'
import { TypeModel } from '../type/type.model'
import { TypeWithCategoriesController } from './type-categories.controller'
import { TypeCategoriesModel } from './type-categories.model'
import { TypeCategoriesService } from './type-categories.service'
import { ITypeCategoriesService } from './type-categories.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([TypeCategoriesModel, CategoryModel, TypeModel]),
  ],
  controllers: [TypeWithCategoriesController],
  providers: [
    {
      provide: ITypeCategoriesService,
      useClass: TypeCategoriesService,
    },
  ],
  exports: [ITypeCategoriesService],
})
export class TypesCategoriesModule {}
