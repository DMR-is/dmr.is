import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { createRedisCacheOptions } from '@dmr.is/utils/server/cacheUtils'

import { AdvertModel } from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import { AdvertPublishService } from './advert-publish.service'
import { IAdvertPublishService } from './advert-publish.service.interface'
@Module({
  imports: [
    createRedisCacheOptions('lg-advert-publications'),
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
