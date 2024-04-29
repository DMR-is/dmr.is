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
  SharedJournalModule,
} from '@dmr.is/modules'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { JournalController } from './journal.controller'

@Module({
  imports: [
    LoggingModule,
    SharedJournalModule,
    SequelizeModule.forFeature([
      AdvertDTO,
      AdvertAttachmentsDTO,
      AdvertCategoriesDTO,
      AdvertCategoryDTO,
      AdvertDepartmentDTO,
      AdvertInvolvedPartyDTO,
      AdvertMainCategoryDTO,
      AdvertStatusDTO,
      AdvertStatusHistoryDTO,
      AdvertTypeDTO,
      CategoryDepartmentsDTO,
    ]),
  ],
  controllers: [JournalController],
  providers: [],
  exports: [],
})
export class JournalModule {}
