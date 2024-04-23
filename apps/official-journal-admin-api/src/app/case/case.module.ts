import { LoggingModule } from '@dmr.is/logging'
import { SharedCaseModule } from '@dmr.is/modules'

import { Module } from '@nestjs/common'

import { CaseController } from './case.controller'

@Module({
  imports: [LoggingModule, SharedCaseModule],
  controllers: [CaseController],
})
export class CaseModule {}
