import { Module } from '@nestjs/common'
import { ICaseChannelService } from './case-channel.service.interface'
import { CaseChannelService } from './case-channel.service'
import { SequelizeModule } from '@nestjs/sequelize'
import {
  CaseChannelModel,
  CaseChannelsModel,
} from '@dmr.is/official-journal/models'

@Module({
  imports: [SequelizeModule.forFeature([CaseChannelModel, CaseChannelsModel])],
  controllers: [],
  providers: [
    {
      provide: ICaseChannelService,
      useClass: CaseChannelService,
    },
  ],
  exports: [ICaseChannelService],
})
export class CaseChannelModule {}
