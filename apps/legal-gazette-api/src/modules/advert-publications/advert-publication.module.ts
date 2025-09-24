import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../advert/advert.model'
import { TBRModule } from '../tbr/tbr.module'
import { AdvertPublishedListener } from './listeners/advert-published.listener'
import { AdvertPublicationController } from './advert-publication.controller'
import { AdvertPublicationModel } from './advert-publication.model'
import { AdvertPublicationService } from './advert-publication.service'
import { IAdvertPublicationService } from './advert-publication.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([AdvertModel, AdvertPublicationModel]),
    TBRModule.forRoot({
      chargeCategory: process.env.LG_TBR_CHARGE_CATEGORY!,
      credentials: process.env.LG_TBR_CREDENTIALS!,
      officeId: process.env.LG_TBR_OFFICE_ID!,
      tbrPath: process.env.LG_TBR_PATH!,
    }),
  ],
  controllers: [AdvertPublicationController],
  providers: [
    {
      provide: IAdvertPublicationService,
      useClass: AdvertPublicationService,
    },
    AdvertPublishedListener,
  ],
  exports: [IAdvertPublicationService],
})
export class AdvertPublicationModule {}
