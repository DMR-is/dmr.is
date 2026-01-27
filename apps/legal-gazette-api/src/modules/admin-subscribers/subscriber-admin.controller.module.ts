import { Module } from '@nestjs/common'

import { SubscriberAdminController } from './subscriber-admin.controller';
import { SubscriberAdminProviderModule } from './subscriber-admin.provider.module';


@Module({
  imports: [SubscriberAdminProviderModule],
  controllers: [SubscriberAdminController],
})
export class SubscriberAdminControllerModule {}
