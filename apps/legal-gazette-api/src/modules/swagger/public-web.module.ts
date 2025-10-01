import { Module } from '@nestjs/common'

import { AdvertPublicationModule } from '../advert-publications/advert-publication.module'
import { BaseEntityModule } from '../base-entity/base-entity.module'
import { SubscriberModule } from '../subscribers/subscriber.module'

@Module({
  imports: [BaseEntityModule, SubscriberModule, AdvertPublicationModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class PublicWebModule {}
