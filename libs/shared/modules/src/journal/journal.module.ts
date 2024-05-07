import { SequelizeConfigService } from '@dmr.is/db'
import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

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
} from '../models'
import { JournalService } from './journal.service'
import { IJournalService } from './journal.service.interface'
import { MockJournalService } from './journal.service.mock'

const MOCK_DATA = process.env.API_MOCK === 'true'
@Module({
  imports: [
    LoggingModule,
    SequelizeModule.forRootAsync({
      useClass: SequelizeConfigService,
    }),
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
