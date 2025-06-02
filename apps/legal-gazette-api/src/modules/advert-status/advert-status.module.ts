import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertStatusController } from './advert-status.controller'
import { AdvertStatusModel } from './advert-status.model'

@Module({
  imports: [SequelizeModule.forFeature([AdvertStatusModel])],
  controllers: [AdvertStatusController],
  providers: [],
  exports: [],
})
export class AdvertStatusModule {}
