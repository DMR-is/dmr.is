import { Module } from '@nestjs/common'

import { PaymentsController } from './payments.controller'
import { PyamentsProviderModule } from './payments.provider.module'

@Module({
  imports: [PyamentsProviderModule],
  controllers: [PaymentsController],
})
export class PaymentsControllerModule {}
