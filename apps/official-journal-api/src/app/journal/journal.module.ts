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

import { SequelizeConfigService } from '../../sequelizeConfig.service'
import { JournalController } from './journal.controller'
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
