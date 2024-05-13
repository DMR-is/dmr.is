import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { JournalService } from './journal.service'
import { IJournalService } from './journal.service.interface'
import { MockJournalService } from './journal.service.mock'

const MOCK_DATA = process.env.API_MOCK === 'true'
import { models as caseModels } from '../case/models'
import { models as advertModels } from './models'
@Module({
  imports: [
    LoggingModule,
    SequelizeModule.forFeature([...advertModels, ...caseModels]),
  ],
  controllers: [],
  providers: [
    {
      provide: IJournalService,
      useClass: MOCK_DATA ? MockJournalService : JournalService,
    },
  ],
  exports: [IJournalService],
})
export class SharedJournalModule {}
