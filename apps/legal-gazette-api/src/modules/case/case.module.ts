import { Module } from '@nestjs/common'

import { CaseController } from './case.controller'
import { CaseProviderModule } from './case.provider.module'

@Module({
  imports: [CaseProviderModule],
  controllers: [CaseController],
  providers: [],
  exports: [],
})
export class CaseControllerModule {}
