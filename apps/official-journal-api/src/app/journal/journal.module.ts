import { Module } from '@nestjs/common'

import {
  AdvertTypeController,
  AdvertTypeModule,
  SharedCaseModule,
  SharedJournalModule,
} from '@dmr.is/modules'

import { JournalController } from './journal.controller'
@Module({
  imports: [SharedJournalModule, SharedCaseModule, AdvertTypeModule],
  controllers: [JournalController, AdvertTypeController],
})
export class JournalModule {}
