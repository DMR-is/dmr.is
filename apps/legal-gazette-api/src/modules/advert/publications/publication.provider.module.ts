import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import { PublicationSearchEventModel } from '../../../models/publication-search-event.model'
import { AdvertPublicationsCacheModule } from '../advert-publications-cache'
import { PublicationService } from './publication.service'
import { IPublicationService } from './publication.service.interface'
import { PublicationSearchTrackingService } from './publication-search-tracking.service'

@Module({
  imports: [
    AdvertPublicationsCacheModule,
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
