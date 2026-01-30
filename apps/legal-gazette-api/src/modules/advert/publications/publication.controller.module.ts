import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CanPublishGuard } from '../../../core/guards/can-publish.guard'
import { AdvertModel } from '../../../models/advert.model'
import { AdvertPublicationController } from './publication.controller'
import { PublicationProviderModule } from './publication.provider.module'

@Module({
  imports: [
    PublicationProviderModule,
    SequelizeModule.forFeature([AdvertModel]), // for CanPublishGuard
  ],
  controllers: [AdvertPublicationController],
  providers: [CanPublishGuard],
  exports: [],
})
export class PublicationControllerModule {}
