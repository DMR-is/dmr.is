import { Module } from '@nestjs/common'

import { AdvertGuardsModule } from '../../../core/guards'
import { AdvertPublicationController } from './publication.controller'
import { PublicationProviderModule } from './publication.provider.module'

@Module({
  imports: [PublicationProviderModule, AdvertGuardsModule],
  controllers: [AdvertPublicationController],
})
export class PublicationControllerModule {}
