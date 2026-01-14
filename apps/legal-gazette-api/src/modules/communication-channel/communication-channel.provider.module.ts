import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../models/advert.model'
import { CommunicationChannelModel } from '../../models/communication-channel.model'
import { CommunicationChannelController } from './communication-channel.controller'
import { CommunicationChannelService } from './communication-channel.service'
import { ICommunicationChannelService } from './communication-channel.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([CommunicationChannelModel, AdvertModel]),
  ],
  controllers: [CommunicationChannelController],
  providers: [
    {
      provide: ICommunicationChannelService,
      useClass: CommunicationChannelService,
    },
  ],
  exports: [ICommunicationChannelService],
})
export class CommunicationChannelProviderModule {}
