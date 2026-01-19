import { Module } from '@nestjs/common'

import { createRedisCacheOptions } from '@dmr.is/utils/cache'

import { AdvertPublicationController } from './publication.controller'
import { PublicationProviderModule } from './publication.provider.module'

@Module({
  imports: [
    createRedisCacheOptions('lg-advert-publications'),
    PublicationProviderModule,
  ],
  controllers: [AdvertPublicationController],
  providers: [],
  exports: [],
})
export class PublicationControllerModule {}
