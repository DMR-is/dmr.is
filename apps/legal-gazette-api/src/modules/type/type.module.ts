import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { TypeModel } from '../../models/type.model'
import { TypeController } from './type.controller'

@Module({
  imports: [SequelizeModule.forFeature([TypeModel])],
  controllers: [TypeController],
})
export class TypeControllerModule {}
