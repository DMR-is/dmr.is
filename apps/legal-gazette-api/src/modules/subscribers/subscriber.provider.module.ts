import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { SubscriberModel } from '../../models/subscriber.model'
<<<<<<< HEAD
=======
import { SubscriberPaymentModel } from '../../models/subscriber-payment.model'
import { LegacyMigrationProviderModule } from '../legacy-migration/legacy-migration.provider.module'
import { TBRModule } from '../tbr/tbr.module'
import { SubscriberCreatedListener } from './listeners/subscriber-created.listener'
>>>>>>> 36e88b13 (initial subsciber payment)
import { SubscriberController } from './subscriber.controller'
import { SubscriberService } from './subscriber.service'
import { ISubscriberService } from './subscriber.service.interface'

@Module({
<<<<<<< HEAD
  imports: [SequelizeModule.forFeature([SubscriberModel])],
=======
  imports: [
    SequelizeModule.forFeature([SubscriberModel, SubscriberPaymentModel]),
    LegacyMigrationProviderModule,
    TBRModule.forRoot({
      credentials: process.env.LG_TBR_CREDENTIALS || '',
      officeId: process.env.LG_TBR_OFFICE_ID || '',
      tbrBasePath: process.env.LG_TBR_PATH || '',
    }),
  ],
>>>>>>> 36e88b13 (initial subsciber payment)
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
