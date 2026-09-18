import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import { AdvertPublicationsCacheModule } from '../advert-publications-cache'
import { AdvertPublishService } from './advert-publish.service'
import { IAdvertPublishService } from './advert-publish.service.interface'
@Module({
  imports: [
    AdvertPublicationsCacheModule,
    SequelizeModule.forFeature([AdvertModel, AdvertPublicationModel]),
  ],
  providers: [
    {
      provide: IAdvertPublishService,
      useClass: AdvertPublishService,
    },
  ],
  exports: [IAdvertPublishService],
})
export class AdvertPublishProviderModule {}
