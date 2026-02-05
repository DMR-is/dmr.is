import { Module } from '@nestjs/common'

import { AdvertGuardsModule } from '../../../core/guards'
import { AdvertPublishController } from './advert-publish.controller'
import { AdvertPublishProviderModule } from './advert-publish.provider.module'

@Module({
  imports: [AdvertPublishProviderModule, AdvertGuardsModule],
  controllers: [AdvertPublishController],
  providers: [],
  exports: [],
})
export class AdvertPublishControllerModule {}
