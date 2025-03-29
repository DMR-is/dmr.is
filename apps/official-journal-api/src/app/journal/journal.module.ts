import {
  AdvertCategoriesModel,
  AdvertCategoryCategoriesModel,
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
  AdvertMainCategoryModel,
  AdvertModel,
  AdvertStatusModel,
  CaseModel,
} from '@dmr.is/official-journal/models'
import { DepartmentModule } from '@dmr.is/official-journal/modules/department'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { JournalService } from './journal.service'
import { IJournalService } from './journal.service.interface'
import { MockJournalService } from './journal.service.mock'

const MOCK_DATA = process.env.API_MOCK === 'true'

@Module({
  imports: [
    SequelizeModule.forFeature([
      AdvertModel,
      AdvertMainCategoryModel,
      AdvertDepartmentModel,
      AdvertInvolvedPartyModel,
      AdvertCategoryModel,
      AdvertCategoriesModel,
      AdvertCategoryCategoriesModel,
      AdvertStatusModel,
      CaseModel,
    ]),
    DepartmentModule,
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
export class JournalModule {}
