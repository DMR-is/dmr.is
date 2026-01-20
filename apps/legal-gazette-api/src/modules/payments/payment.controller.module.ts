import { Module } from '@nestjs/common'

import { PaymentsController } from './payments.controller'
import { PaymentsProviderModule } from './payments.provider.module'

@Module({
  imports: [PaymentsProviderModule],
  controllers: [PaymentsController],
})
export class PaymentsControllerModule {}
