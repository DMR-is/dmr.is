import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { ICaseService } from './case.service.interface'
import { CaseCreateService } from './services/create/case-create.service'
import { ICaseCreateService } from './services/create/case-create.service.interface'
import { CaseUpdateService } from './services/update/case-update.service'
import { ICaseUpdateService } from './services/update/case-update.service.interface'
import { CaseService } from './case.service'
import { CaseServiceMock } from './case.service.mock'
import { CaseAdditionModel } from './models/case-addition.model'
import { CaseAdditionsModel } from './models/case-additions.model'
import { CaseCategoriesModel } from './models/case-categories.model'
import { CaseChannelModel } from './models/case-channel.model'
import { CaseChannelsModel } from './models/case-channels.model'
import { CaseCommunicationStatusModel } from './models/case-communication-status.model'
import { CaseHistoryModel } from './models/case-history.model'
import { CasePublishedAdvertsModel } from './models/case-published-adverts'
import { CaseStatusModel } from './models/case-status.model'
import { CaseTagModel } from './models/case-tag.model'
import { CaseTransactionModel } from './models/case-transaction.model'
import { CaseModel } from './models/case.model'
import { TransactionFeeCodesModel } from './models/transaction-fee-codes.model'

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
      CasePublishedAdvertsModel,
      CaseCategoriesModel,
      CaseChannelsModel,
      CaseAdditionsModel,
      TransactionFeeCodesModel,
      CaseCommunicationStatusModel,
    ]),
    SharedJournalModule,
    SignatureModule,
    CommentModuleV2,
    forwardRef(() => PriceModule),
    forwardRef(() => PdfModule),
    forwardRef(() => AwsModule),
    forwardRef(() => AttachmentsModule),
    forwardRef(() => UtilityModule),
    forwardRef(() => ApplicationModule),
    forwardRef(() => SharedJournalModule),
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
