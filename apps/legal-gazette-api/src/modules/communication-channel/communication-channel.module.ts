import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CommunicationChannelController } from './communication-channel.controller'
import { CommunicationChannelModel } from '../../models/communication-channel.model'
import { CommunicationChannelService } from './communication-channel.service'
import { ICommunicationChannelService } from './communication-channel.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([CommunicationChannelModel])],
  controllers: [CommunicationChannelController],
  providers: [
    {
      provide: ICommunicationChannelService,
      useClass: CommunicationChannelService,
    },
  ],
  exports: [ICommunicationChannelService],
})
export class CommunicationChannelModule {}
