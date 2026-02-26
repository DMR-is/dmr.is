import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { LoggingModule } from '@dmr.is/logging'
import { AwsModule } from '@dmr.is/shared-modules'
import { createRedisCacheOptions } from '@dmr.is/utils-server/cacheUtils'

import caseModels from '../case/models'
import { JournalService } from './journal.service'
import { IJournalService } from './journal.service.interface'
import { MockJournalService } from './journal.service.mock'
import { models as advertModels } from './models'

const MOCK_DATA = process.env.API_MOCK === 'true'


@Module({
  imports: [
    createRedisCacheOptions('ojoi-journal'),
    SequelizeModule.forFeature([...caseModels, ...advertModels]),
    LoggingModule,
    AwsModule,
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
