import { Module } from '@nestjs/common'

import { IssusesTaskModule } from './issues/issues.task.module'
import { PaymentTaskModule } from './payment/payment.task.module'
import { PublishingTaskModule } from './publishing/publishing.task.module'

@Module({
  imports: [IssusesTaskModule, PaymentTaskModule, PublishingTaskModule],
})
export class TaskModule {}
