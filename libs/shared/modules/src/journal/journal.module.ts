import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { JournalService } from './journal.service'
import { IJournalService } from './journal.service.interface'
import { MockJournalService } from './journal.service.mock'
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
} from './models'

const MOCK_DATA = process.env.API_MOCK === 'true'
@Module({
  imports: [
    LoggingModule,
    SequelizeModule.forFeature([
      AdvertMainCategoryDTO,
      AdvertDepartmentDTO,
      AdvertTypeDTO,
      AdvertInvolvedPartyDTO,
      AdvertStatusDTO,
      CategoryDepartmentsDTO,
      AdvertStatusHistoryDTO,
      AdvertCategoriesDTO,
      AdvertCategoryDTO,
      AdvertAttachmentsDTO,
      AdvertDTO,
    ]),
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
