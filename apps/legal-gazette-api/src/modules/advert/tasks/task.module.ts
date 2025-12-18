import { Module } from '@nestjs/common'

import { IssusesTaskModule } from './issues/issues.task.module'
import { AdvertPaymentTaskModule } from './payment/advert-payment.task.module'
import { PublishingTaskModule } from './publishing/publishing.task.module'
import { PgAdvisoryLockModule } from './lock.module'

@Module({
  imports: [
    PgAdvisoryLockModule,
    IssusesTaskModule,
    AdvertPaymentTaskModule,
    PublishingTaskModule,
  ],
})
export class TaskModule {}
