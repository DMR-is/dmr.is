import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { StatusController } from './status.controller'
import { StatusModel } from '../../models/status.model'

@Module({
  imports: [SequelizeModule.forFeature([StatusModel])],
  controllers: [StatusController],
  providers: [],
  exports: [],
})
export class StatusModule {}
