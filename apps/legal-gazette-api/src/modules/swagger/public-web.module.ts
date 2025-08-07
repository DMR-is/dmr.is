import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'

import { SubscriberGuard } from '../../guards/subscriber/subscriber-guard'
import { AdvertModule } from '../advert/advert.module'
import { BaseEntityModule } from '../base-entity/base-entity.module'
import { SubscriberModule } from '../subscribers/subscriber.module'


@Module({
  imports: [
    AdvertModule,
    BaseEntityModule,
    SubscriberModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SubscriberGuard
    }
  ],
  exports: [],
})
export class PublicWebModule {}
