import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../advert/advert.model'
import { AdvertPublicationController } from './advert-publication.controller'
import { AdvertPublicationModel } from './advert-publication.model'
import { AdvertPublicationService } from './advert-publication.service'
import { IAdvertPublicationService } from './advert-publication.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([AdvertModel, AdvertPublicationModel])],
  controllers: [AdvertPublicationController],
  providers: [
    {
      provide: IAdvertPublicationService,
      useClass: AdvertPublicationService,
    },
  ],
  exports: [IAdvertPublicationService],
})
export class AdvertPublicationModule {}
