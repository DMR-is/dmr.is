import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseCategoryController } from './case-category.controller'
import { CaseCategoryModel } from './case-category.model'
import { CaseCategoryService } from './case-category.service'
import { ICaseCategoryService } from './case-category.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([CaseCategoryModel])],
  controllers: [CaseCategoryController],
  providers: [
    {
      provide: ICaseCategoryService,
      useClass: CaseCategoryService,
    },
  ],
  exports: [ICaseCategoryService],
})
export class CaseCategoryModule {}
