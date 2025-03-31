import {
  CaseAdditionModel,
  CaseAdditionsModel,
  CaseCategoriesModel,
  CaseChannelModel,
  CaseChannelsModel,
  CaseCommunicationStatusModel,
  CaseHistoryModel,
  CaseModel,
  CaseStatusModel,
  CaseTagModel,
  CaseTransactionModel,
  TransactionFeeCodesModel,
} from '@dmr.is/official-journal/models'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseCreateService } from './services/create/case-create.service'
import { ICaseCreateService } from './services/create/case-create.service.interface'
import { CaseUpdateService } from './services/update/case-update.service'
import { ICaseUpdateService } from './services/update/case-update.service.interface'
import { CaseService } from './case.service'
import { ICaseService } from './case.service.interface'
import { CaseServiceMock } from './case.service.mock'
const API_MOCK = process.env.API_MOCK === 'true'

@Module({
  imports: [
    SequelizeModule.forFeature([
      CaseModel,
      CaseStatusModel,
      CaseHistoryModel,
      CaseTagModel,
      CaseChannelModel,
      CaseAdditionModel,
      CaseTransactionModel,
      CaseCategoriesModel,
      CaseChannelsModel,
      CaseAdditionsModel,
      TransactionFeeCodesModel,
      CaseCommunicationStatusModel,
    ]),
  ],
  providers: [
    {
      provide: ICaseService,
      useClass: API_MOCK ? CaseServiceMock : CaseService,
    },
    {
      provide: ICaseUpdateService,
      useClass: CaseUpdateService,
    },
    {
      provide: ICaseCreateService,
      useClass: CaseCreateService,
    },
  ],
  exports: [ICaseService],
})
export class CaseModule {}
