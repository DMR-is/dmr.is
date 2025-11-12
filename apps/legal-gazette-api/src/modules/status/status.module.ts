import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { StatusModel } from '../../models/status.model'
import { StatusController } from './status.controller'

@Module({
  imports: [SequelizeModule.forFeature([StatusModel])],
  controllers: [StatusController],
  providers: [],
  exports: [],
})
export class StatusModule {}
