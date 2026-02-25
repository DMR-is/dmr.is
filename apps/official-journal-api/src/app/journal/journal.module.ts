import { Module } from '@nestjs/common'

import {
  AdvertTypeController,
  AdvertTypeModule,
  IssuesModule,
  OpenSearchModule,
  OpsModule,
  SharedCaseModule,
  SharedJournalModule,
} from '@dmr.is/ojoi/modules'

import { JournalController } from './journal.controller'
@Module({
  imports: [
    SharedJournalModule,
    SharedCaseModule,
    AdvertTypeModule,
    OpenSearchModule,
    OpsModule,
    IssuesModule,
  ],
  controllers: [JournalController, AdvertTypeController],
})
export class JournalModule {}
