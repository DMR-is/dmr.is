import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseCategoryModel } from './case-category.model'

@Module({
  imports: [SequelizeModule.forFeature([CaseCategoryModel])],
  controllers: [],
  providers: [],
  exports: [],
})
export class CaseCategoryModule {}
