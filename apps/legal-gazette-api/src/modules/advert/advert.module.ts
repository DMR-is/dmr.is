import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertController } from './advert.controller'
import { AdvertModel } from './advert.model'
import { AdvertService } from './advert.service'
import { IAdvertService } from './advert.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([AdvertModel])],
  controllers: [AdvertController],
  providers: [
    {
      provide: IAdvertService,
      useClass: AdvertService,
    },
  ],
  exports: [IAdvertService],
})
export class AdvertModule {}
