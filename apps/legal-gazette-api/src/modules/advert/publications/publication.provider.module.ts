import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { createRedisCacheOptions } from '@dmr.is/utils-server/cacheUtils'

import { AdvertModel } from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import { PublicationSearchEventModel } from '../../../models/publication-search-event.model'
import { PublicationService } from './publication.service'
import { IPublicationService } from './publication.service.interface'
import { PublicationSearchTrackingService } from './publication-search-tracking.service'

@Module({
  imports: [
    createRedisCacheOptions('lg-advert-publications'),
    SequelizeModule.forFeature([
      AdvertModel,
      AdvertPublicationModel,
      PublicationSearchEventModel,
    ]),
  ],
  controllers: [],
  providers: [
    {
      provide: IPublicationService,
      useClass: PublicationService,
    },
    PublicationSearchTrackingService,
  ],
  exports: [IPublicationService, PublicationSearchTrackingService],
})
export class PublicationProviderModule {}
