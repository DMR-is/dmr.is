import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { TypeController } from './type.controller'
import { TypeModel } from './type.model'

@Module({
  imports: [SequelizeModule.forFeature([TypeModel])],
  controllers: [TypeController],
})
export class TypeModule {}
