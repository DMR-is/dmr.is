import { Module } from '@nestjs/common'

import { AdvertPublicationControllerModule } from '../publications/publication.module'
import { BaseEntityControllerModule } from '../base-entity/base-entity.module'
import { SubscriberModule } from '../subscribers/subscriber.module'

@Module({
  imports: [
    BaseEntityControllerModule,
    SubscriberModule,
    AdvertPublicationControllerModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class PublicWebModule {}
