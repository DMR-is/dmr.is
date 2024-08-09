import { SharedCaseModule, SharedJournalModule } from '@dmr.is/modules'

import { Module } from '@nestjs/common'

import { JournalController } from './journal.controller'
@Module({
  imports: [SharedJournalModule, SharedCaseModule],
  controllers: [JournalController],
})
export class JournalModule {}
