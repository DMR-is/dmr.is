import { LoggingModule } from '@dmr.is/logging'
import { SharedCaseModule, SharedJournalModule } from '@dmr.is/modules'

import { Module } from '@nestjs/common'

import { CaseController } from './case.controller'

@Module({
  imports: [LoggingModule, SharedCaseModule, SharedJournalModule],
  controllers: [CaseController],
})
export class CaseModule {}
