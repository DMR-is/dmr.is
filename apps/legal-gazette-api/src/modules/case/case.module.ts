import { Module } from '@nestjs/common'

import { CaseModule } from '../../services/case/case.module'
import { CaseController } from './case.controller'

@Module({
  imports: [CaseModule],
  controllers: [CaseController],
  providers: [],
  exports: [],
})
export class CaseControllerModule {}
