import { Module } from '@nestjs/common'

import { LoggingModule } from '@dmr.is/logging'

import { JournalController } from './journal.controller'
import { JournalService } from './journal.service'
import { IJournalService } from './journal.service.interface'
import { MockJournalService } from './journal.service.mock'

const MOCK_DATA = true

@Module({
  imports: [LoggingModule],
  controllers: [JournalController],
  providers: [
    {
      provide: IJournalService,
      useClass: MOCK_DATA ? MockJournalService : JournalService,
    },
  ],
})
export class JournalModule {}
