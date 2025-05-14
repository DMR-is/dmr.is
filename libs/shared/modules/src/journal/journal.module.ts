import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { JournalService } from './journal.service'
import { IJournalService } from './journal.service.interface'
import { MockJournalService } from './journal.service.mock'

const MOCK_DATA = process.env.API_MOCK === 'true'

import { createRedisCacheOptions } from '@dmr.is/utils/cache'

import { AwsModule } from '../aws/aws'
import caseModels from '../case/models'
import { models as advertModels } from './models'

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
