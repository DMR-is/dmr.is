import { Module } from '@nestjs/common'

import { AdvertPublicationController } from './publication.controller'
import { PublicationProviderModule } from './publication.provider.module'

@Module({
  imports: [PublicationProviderModule],
  controllers: [AdvertPublicationController],
  providers: [],
  exports: [],
})
export class AdvertPublicationControllerModule {}
