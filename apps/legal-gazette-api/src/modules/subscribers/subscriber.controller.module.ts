import { Module } from '@nestjs/common'

import { SubscriberController } from './subscriber.controller'
import { SubscriberProviderModule } from './subscriber.provider.module'
import { SubscriberAdminController } from './subscriber-admin.controller'

@Module({
  imports: [SubscriberProviderModule],
  controllers: [SubscriberController, SubscriberAdminController],
})
export class SubscriberControllerModule {}
