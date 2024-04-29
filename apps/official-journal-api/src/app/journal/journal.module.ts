import { LoggingModule } from '@dmr.is/logging'
import {
  AdvertCategoriesDTO,
  AdvertCategoryDTO,
  AdvertDepartmentDTO,
  AdvertDTO,
  AdvertInvolvedPartyDTO,
  AdvertMainCategoryDTO,
  AdvertStatusDTO,
  AdvertStatusHistoryDTO,
  AdvertTypeDTO,
  IJournalService,
  JournalService,
  MockJournalService,
} from '@dmr.is/modules'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { JournalController } from './journal.controller'

const MOCK_DATA = process.env.API_MOCK === 'true'
@Module({
  imports: [
    LoggingModule,
    SequelizeModule.forFeature([
      AdvertDTO,
      AdvertCategoriesDTO,
      AdvertCategoryDTO,
      AdvertMainCategoryDTO,
      AdvertDepartmentDTO,
      AdvertStatusDTO,
      AdvertStatusHistoryDTO,
      AdvertTypeDTO,
      AdvertInvolvedPartyDTO,
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
