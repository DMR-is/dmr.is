import { Module } from '@nestjs/common'

import { IssusesTaskModule } from './issues/issues.task.module'
import { AdvertPaymentTaskModule } from './payment/advert-payment.task.module'
import { PublishingTaskModule } from './publishing/publishing.task.module'

@Module({
  imports: [IssusesTaskModule, AdvertPaymentTaskModule, PublishingTaskModule],
})
export class TaskModule {}
