import {
  AdvertModel,
  CaseAdditionModel,
  CaseAdditionsModel,
  CaseCategoriesModel,
  CaseModel,
  CaseStatusModel,
  CaseTransactionModel,
  TransactionFeeCodesModel,
} from '@dmr.is/official-journal/models'
import { AdvertModule } from '@dmr.is/official-journal/modules/advert'
import { AdvertCorrectionModule } from '@dmr.is/official-journal/modules/advert-correction'
import { AttachmentModule } from '@dmr.is/official-journal/modules/attachment'
import { CaseModule } from '@dmr.is/official-journal/modules/case'
import { CaseHistoryModule } from '@dmr.is/official-journal/modules/case-history'
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
import { OfficialJournalCaseController } from './ojoi-case.controller'
import { OfficialJournalCaseService } from './ojoi-case.service'
import { IOfficialJournalCaseService } from './ojoi-case.service.interface'
import { CaseServiceMock } from './ojoi-case.service.mock'
const API_MOCK = process.env.API_MOCK === 'true'

@Module({
  imports: [
    SequelizeModule.forFeature([
      CaseModel,
      CaseStatusModel,
      CaseAdditionModel,
      CaseTransactionModel,
      CaseCategoriesModel,
      CaseAdditionsModel,
      TransactionFeeCodesModel,
      AdvertModel,
    ]),
    CaseModule,
    CaseHistoryModule,
    PriceModule,
    AdvertCorrectionModule,
    ApplicationModule,
    AdvertModule,
    AttachmentModule,
    AWSModule,
    PdfModule,
    UtilityModule,
    CommentModule,
    SignatureModule,
    PaymentModule,
  ],
  controllers: [OfficialJournalCaseController],
  providers: [
    {
      provide: IOfficialJournalCaseService,
      useClass: API_MOCK ? CaseServiceMock : OfficialJournalCaseService,
    },
  ],
  exports: [IOfficialJournalCaseService],
})
export class OfficialJournalCaseModule {}
