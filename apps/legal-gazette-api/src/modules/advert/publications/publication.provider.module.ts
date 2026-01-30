import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import { PublicationService } from './publication.service'
import { IPublicationService } from './publication.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([AdvertModel, AdvertPublicationModel])],
  controllers: [],
  providers: [
    {
      provide: IPublicationService,
      useClass: PublicationService,
    },
  ],
  exports: [IPublicationService],
})
export class PublicationProviderModule {}
