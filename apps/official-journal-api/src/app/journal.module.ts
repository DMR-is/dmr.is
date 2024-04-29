import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { Advert } from '../../../../libs/shared/modules/src/models/Advert'
import { AdvertCategories } from '../../../../libs/shared/modules/src/models/AdvertCategories'
import { AdvertCategory } from '../../../../libs/shared/modules/src/models/AdvertCategory'
import { AdvertDepartment } from '../../../../libs/shared/modules/src/models/AdvertDepartment'
import { AdvertInvolvedParty } from '../../../../libs/shared/modules/src/models/AdvertInvolvedParty'
import { AdvertMainCategory } from '../../../../libs/shared/modules/src/models/AdvertMainCategory'
import { AdvertStatus } from '../../../../libs/shared/modules/src/models/AdvertStatus'
import { AdvertStatusHistory } from '../../../../libs/shared/modules/src/models/AdvertStatusHistory'
import { AdvertType } from '../../../../libs/shared/modules/src/models/AdvertType'
import { JournalController } from './journal.controller'
import { JournalService } from '../../../../libs/shared/modules/src/journal/journal.service'
import { IJournalService } from '../../../../libs/shared/modules/src/journal/journal.service.interface'
import { MockJournalService } from '../../../../libs/shared/modules/src/journal/journal.service.mock'

const MOCK_DATA = process.env.API_MOCK === 'true'
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
  exports: [IJournalService],
})
export class JournalModule {}
