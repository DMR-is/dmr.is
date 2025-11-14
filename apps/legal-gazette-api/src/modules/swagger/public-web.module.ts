import { Module } from '@nestjs/common'

import { BaseEntityControllerModule } from '../base-entity/base-entity.controller.module'
import { AdvertPublicationControllerModule } from '../publications/publication.controller.module'
import { SubscriberControllerModule } from '../subscribers/subscriber.controller.module'

@Module({
  imports: [
    BaseEntityControllerModule,
    SubscriberControllerModule,
    AdvertPublicationControllerModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class PublicWebModule {}
