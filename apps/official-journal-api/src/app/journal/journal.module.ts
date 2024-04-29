import { LoggingModule } from '@dmr.is/logging'
import {
  AdvertAttachmentsDTO,
  AdvertCategoriesDTO,
  AdvertCategoryDTO,
  AdvertDepartmentDTO,
  AdvertDTO,
  AdvertInvolvedPartyDTO,
  AdvertMainCategoryDTO,
  AdvertStatusDTO,
  AdvertStatusHistoryDTO,
  AdvertTypeDTO,
  CategoryDepartmentsDTO,
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
      AdvertMainCategoryDTO,
      AdvertAttachmentsDTO,
      AdvertCategoriesDTO,
      AdvertCategoryDTO,
      AdvertDepartmentDTO,
      AdvertInvolvedPartyDTO,
      AdvertStatusDTO,
      AdvertStatusHistoryDTO,
      AdvertTypeDTO,
      CategoryDepartmentsDTO,
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
