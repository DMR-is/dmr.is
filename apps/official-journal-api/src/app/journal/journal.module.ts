import { Module } from '@nestjs/common'

// import { ScheduleModule } from '@nestjs/schedule'
import {
  AdvertTypeController,
  AdvertTypeModule,
  OpenSearchModule,
  OpsModule,
  SharedCaseModule,
  SharedJournalModule,
} from '@dmr.is/modules'

import { JournalController } from './journal.controller'
@Module({
  imports: [
    SharedJournalModule,
    SharedCaseModule,
    AdvertTypeModule,
    OpenSearchModule,
    OpsModule,
    // ScheduleModule.forRoot(),
  ],
  controllers: [JournalController, AdvertTypeController],
})
export class JournalModule {}
