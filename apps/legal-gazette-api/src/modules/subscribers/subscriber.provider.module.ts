import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { FeeCodeModel } from '../../models/fee-code.model'
import { SubscriberModel } from '../../models/subscriber.model'
import { SubscriberTransactionModel } from '../../models/subscriber-transaction.model'
import { TBRTransactionModel } from '../../models/tbr-transactions.model'
import { PgAdvisoryLockModule } from '../advert/tasks/lock.module'
import { LGNationalRegistryProviderModule } from '../national-registry/national-registry.provider.module'
import { TBRModule } from '../tbr/tbr.module'
import { SubscriberCreatedListener } from './listeners/subscriber-created.listener'
import { SubscriberService } from './subscriber.service'
import { ISubscriberService } from './subscriber.service.interface'
import { SubscriberAdminService } from './subscriber-admin.service'
import { ISubscriberAdminService } from './subscriber-admin.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      SubscriberModel,
      SubscriberTransactionModel,
      TBRTransactionModel,
      FeeCodeModel,
    ]),
    PgAdvisoryLockModule,
    LGNationalRegistryProviderModule,
    TBRModule.forRoot({
      credentials: process.env.LG_TBR_CREDENTIALS || '',
      officeId: process.env.LG_TBR_OFFICE_ID || '',
      tbrBasePath: process.env.LG_TBR_PATH || '',
    }),
  ],
  controllers: [],
  providers: [
    SubscriberCreatedListener,
    {
      provide: ISubscriberService,
      useClass: SubscriberService,
    },
    {
      provide: ISubscriberAdminService,
      useClass: SubscriberAdminService,
    },
  ],
  exports: [ISubscriberService, ISubscriberAdminService],
})
export class SubscriberProviderModule {}
