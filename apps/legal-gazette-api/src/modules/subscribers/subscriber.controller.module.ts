import { Module } from '@nestjs/common'

import { SubscriberController } from './subscriber.controller'
import { SubscriberProviderModule } from './subscriber.provider.module'

@Module({
  imports: [SubscriberProviderModule],
  controllers: [SubscriberController],
})
export class SubscriberControllerModule {}
