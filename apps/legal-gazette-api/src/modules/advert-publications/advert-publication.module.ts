import { Module } from '@nestjs/common'

import { PublicationModule } from '../../services/publication/publication.module'
import { AdvertPublicationController } from './advert-publication.controller'

@Module({
  imports: [PublicationModule],
  controllers: [AdvertPublicationController],
  providers: [],
  exports: [],
})
export class AdvertPublicationControllerModule {}
