import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { SubscriberModel } from '../../models/subscriber.model'
import { SubscriberController } from './subscriber.controller'
import { SubscriberService } from './subscriber.service'
import { ISubscriberService } from './subscriber.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([SubscriberModel])],
  controllers: [SubscriberController],
  providers: [
    {
      provide: ISubscriberService,
      useClass: SubscriberService,
    },
  ],
  exports: [ISubscriberService],
})
export class SubscriberModule {}
