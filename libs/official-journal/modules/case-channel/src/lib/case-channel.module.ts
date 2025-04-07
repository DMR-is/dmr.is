import {
  CaseChannelModel,
  CaseChannelsModel,
} from '@dmr.is/official-journal/models'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseChannelController } from './case-channel.controller'
import { CaseChannelService } from './case-channel.service'
import { ICaseChannelService } from './case-channel.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([CaseChannelModel, CaseChannelsModel])],
  controllers: [CaseChannelController],
  providers: [
    {
      provide: ICaseChannelService,
      useClass: CaseChannelService,
    },
  ],
  exports: [ICaseChannelService],
})
export class CaseChannelModule {}
