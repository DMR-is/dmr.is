import {
  AdvertCorrectionModel,
  AdvertModel,
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
import { AdvertModule } from '@dmr.is/official-journal/modules/advert'
import { AttachmentModule } from '@dmr.is/official-journal/modules/attachment'
import { CommentModule } from '@dmr.is/official-journal/modules/comment'
import { PdfModule } from '@dmr.is/official-journal/modules/pdf'
import { PriceModule } from '@dmr.is/official-journal/modules/price'
import { SignatureModule } from '@dmr.is/official-journal/modules/signature'
import { UtilityModule } from '@dmr.is/official-journal/modules/utility'
import { ApplicationModule } from '@dmr.is/shared/modules/application'
import { AWSModule } from '@dmr.is/shared/modules/aws'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { PaymentModule } from '../payment/payment.module'
import { CaseCreateService } from './services/create/case-create.service'
import { ICaseCreateService } from './services/create/case-create.service.interface'
import { CaseUpdateService } from './services/update/case-update.service'
import { ICaseUpdateService } from './services/update/case-update.service.interface'
import { CaseController } from './case.controller'
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
      AdvertCorrectionModel,
      AdvertModel,
    ]),
    ApplicationModule,
    AdvertModule,
    AttachmentModule,
    AWSModule,
    PdfModule,
    PriceModule,
    UtilityModule,
    CommentModule,
    PaymentModule,
    SignatureModule,
  ],
  controllers: [CaseController],
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
