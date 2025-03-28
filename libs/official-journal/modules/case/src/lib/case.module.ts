import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { ICaseService } from './case.service.interface'
import { CaseCreateService } from './services/create/case-create.service'
import { ICaseCreateService } from './services/create/case-create.service.interface'
import { CaseUpdateService } from './services/update/case-update.service'
import { ICaseUpdateService } from './services/update/case-update.service.interface'
import { CaseService } from './case.service'
import { CaseServiceMock } from './case.service.mock'
import {
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
} from '@dmr.is/official-journal/models'
import { SignatureModule } from '@dmr.is/official-journal/modules/signature'
import { CommentModule } from '@dmr.is/official-journal/modules/comment'
import { ApplicationModule } from '@dmr.is/official-journal/modules/application'
import { PriceModule } from '@dmr.is/official-journal/modules/price'
import { PdfModule } from '@dmr.is/official-journal/modules/pdf'
import { AttachmentModule } from '@dmr.is/official-journal/modules/attachment'
import { AWSModule } from '@dmr.is/shared/modules/aws'
import { JournalModule } from '@dmr.is/official-journal/modules/journal'
import { UtilityModule } from '@dmr.is/official-journal/modules/utility'
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
    JournalModule,
    SignatureModule,
    CommentModule,
    forwardRef(() => PriceModule),
    forwardRef(() => PdfModule),
    forwardRef(() => AWSModule),
    forwardRef(() => AttachmentModule),
    forwardRef(() => UtilityModule),
    forwardRef(() => ApplicationModule),
    forwardRef(() => JournalModule),
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
