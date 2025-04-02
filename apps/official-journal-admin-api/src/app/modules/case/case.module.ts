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
import { AttachmentModule } from '@dmr.is/official-journal/modules/attachment'
import { CommentModule } from '@dmr.is/official-journal/modules/comment'
import { PdfModule } from '@dmr.is/official-journal/modules/pdf'
import { SignatureModule } from '@dmr.is/official-journal/modules/signature'
import { UtilityModule } from '@dmr.is/official-journal/modules/utility'
import { ApplicationModule } from '@dmr.is/shared/modules/application'
import { AWSModule } from '@dmr.is/shared/modules/aws'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

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
      CaseAdditionModel,
      CaseTransactionModel,
      CaseCategoriesModel,
      CaseAdditionsModel,
      TransactionFeeCodesModel,
      AdvertModel,
    ]),
    ApplicationModule,
    AdvertModule,
    AttachmentModule,
    AWSModule,
    PdfModule,
    UtilityModule,
    CommentModule,
    SignatureModule,
  ],
  controllers: [CaseController],
  providers: [
    {
      provide: ICaseService,
      useClass: API_MOCK ? CaseServiceMock : CaseService,
    },
  ],
  exports: [ICaseService],
})
export class CaseModule {}
