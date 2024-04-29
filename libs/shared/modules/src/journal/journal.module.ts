import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'

import { JournalService } from './journal.service'
import { IJournalService } from './journal.service.interface'
import { MockJournalService } from './journal.service.mock'

export { IJournalService } from './journal.service.interface'

const MOCK_DATA = process.env.API_MOCK === 'true'

@Module({
  imports: [LoggingModule],
  controllers: [],
  providers: [
    {
      provide: IJournalService,
      useClass: MOCK_DATA ? MockJournalService : JournalService,
    },
  ],
  exports: [IJournalService],
})
export class JournalModule {}
