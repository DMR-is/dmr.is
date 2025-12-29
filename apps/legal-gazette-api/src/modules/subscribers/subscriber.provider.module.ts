import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { SubscriberModel } from '../../models/subscriber.model'
import { SubscriberPaymentModel } from '../../models/subscriber-payment.model'
import { TBRModule } from '../tbr/tbr.module'
import { SubscriberCreatedListener } from './listeners/subscriber-created.listener'
import { SubscriberController } from './subscriber.controller'
import { SubscriberService } from './subscriber.service'
import { ISubscriberService } from './subscriber.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([SubscriberModel, SubscriberPaymentModel]),
    TBRModule.forRoot({
      credentials: process.env.LG_TBR_CREDENTIALS || '',
      officeId: process.env.LG_TBR_OFFICE_ID || '',
      tbrBasePath: process.env.LG_TBR_PATH || '',
    }),
  ],
  controllers: [SubscriberController],
  providers: [
    SubscriberCreatedListener,
    {
      provide: ISubscriberService,
      useClass: SubscriberService,
    },
  ],
  exports: [ISubscriberService],
})
export class SubscriberProviderModule {}
