import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { Advert } from '../models/Advert'
import { AdvertCategories } from '../models/AdvertCategories'
import { AdvertCategory } from '../models/AdvertCategory'
import { AdvertDepartment } from '../models/AdvertDepartment'
import { AdvertInvolvedParty } from '../models/AdvertInvolvedParty'
import { AdvertMainCategory } from '../models/AdvertMainCategory'
import { AdvertStatus } from '../models/AdvertStatus'
import { AdvertStatusHistory } from '../models/AdvertStatusHistory'
import { AdvertType } from '../models/AdvertType'
import { JournalController } from './journal.controller'
import { JournalService } from './journal.service'
import { IJournalService } from './journal.service.interface'
import { MockJournalService } from './journal.service.mock'

const MOCK_DATA = false

@Module({
  imports: [
    LoggingModule,
    SequelizeModule.forFeature([
      Advert,
      AdvertCategories,
      AdvertCategory,
      AdvertMainCategory,
      AdvertDepartment,
      AdvertStatus,
      AdvertStatusHistory,
      AdvertType,
      AdvertInvolvedParty,
    ]),
  ],
  controllers: [JournalController],
  providers: [
    {
      provide: IJournalService,
      useClass: MOCK_DATA ? MockJournalService : JournalService,
    },
  ],
})
export class JournalModule {}
