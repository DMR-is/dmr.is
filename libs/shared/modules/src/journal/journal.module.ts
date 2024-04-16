import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { JournalController } from './journal.controller'
import { JournalService } from './journal.service'
import { IJournalService } from './journal.service.interface'
import { MockJournalService } from './journal.service.mock'

const MOCK_DATA = process.env.API_MOCK === 'true'

@Module({
  imports: [LoggingModule, AuthModule],
  controllers: [JournalController],
  providers: [
    {
      provide: IJournalService,
      useClass: MOCK_DATA ? MockJournalService : JournalService,
    },
  ],
})
export class JournalModule {}
