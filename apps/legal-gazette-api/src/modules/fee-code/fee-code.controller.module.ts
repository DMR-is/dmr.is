import { Module } from '@nestjs/common'

import { FeeCodeController } from './fee-code.controller'
import { FeeCodeProviderModule } from './fee-code.provider.module'

@Module({
  imports: [FeeCodeProviderModule],
  controllers: [FeeCodeController],
})
export class FeeCodeModule {}
