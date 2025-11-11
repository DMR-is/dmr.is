import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CategoryController } from './category.controller'
import { CategoryModel } from '../../models/category.model'

@Module({
  imports: [SequelizeModule.forFeature([CategoryModel])],
  controllers: [CategoryController],
})
export class CategoryModule {}
