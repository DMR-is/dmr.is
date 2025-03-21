import {
  AdvertTypeController,
  AdvertTypeModule,
  SharedCaseModule,
  SharedJournalModule,
} from '@dmr.is/modules'

import { Module } from '@nestjs/common'

import { JournalController } from './journal.controller'
@Module({
  imports: [SharedJournalModule, SharedCaseModule, AdvertTypeModule],
  controllers: [JournalController, AdvertTypeController],
})
export class JournalModule {}
