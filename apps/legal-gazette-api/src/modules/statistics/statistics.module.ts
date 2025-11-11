import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../models/advert.model'
import { CommentModel } from '../../models/comment.model'
import { StatisticsController } from './statistics.controller'
import { StatisticsService } from './statistics.service'
import { IStatisticsService } from './statistics.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([AdvertModel, CommentModel])],
  controllers: [StatisticsController],
  providers: [
    {
      provide: IStatisticsService,
      useClass: StatisticsService,
    },
  ],
  exports: [IStatisticsService],
})
export class StatisticsModule {}
