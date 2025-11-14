import { Module } from '@nestjs/common'

import { PublicationControllerModule } from '../advert/publications/publication.controller.module'
import { BaseEntityControllerModule } from '../base-entity/base-entity.controller.module'
import { SubscriberControllerModule } from '../subscribers/subscriber.controller.module'

@Module({
  imports: [
    BaseEntityControllerModule,
    SubscriberControllerModule,
    PublicationControllerModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class PublicWebModule {}
