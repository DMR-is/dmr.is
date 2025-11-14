import { Module } from '@nestjs/common'

import { CommunicationChannelController } from './communication-channel.controller'
import { CommunicationChannelProviderModule } from './communication-channel.provider.module'

@Module({
  imports: [CommunicationChannelProviderModule],
  controllers: [CommunicationChannelController],
})
export class CommunicationChannelControllerModule {}
