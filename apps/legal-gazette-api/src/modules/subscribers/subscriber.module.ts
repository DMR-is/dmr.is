import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { SubscriberController } from './subscriber.controller'
import { SubscriberModel } from './subscriber.model'
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
