import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CategoryModel } from '../../../models/category.model'
import { CategoryController } from './category.controller'

@Module({
  imports: [SequelizeModule.forFeature([CategoryModel])],
  controllers: [CategoryController],
})
export class CategoryControllerModule {}
