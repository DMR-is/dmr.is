import { LoggingModule } from '@dmr.is/logging'
import {
  CaseCommunicationStatusModel,
  CaseHistoryModel,
  CaseModel,
} from '@dmr.is/official-journal/models'
import { AdvertModule } from '@dmr.is/official-journal/modules/advert'
import { AdvertTypeModule } from '@dmr.is/official-journal/modules/advert-type'
import { AttachmentModule } from '@dmr.is/official-journal/modules/attachment'
import { CaseModule } from '@dmr.is/official-journal/modules/case'
import { CommentModule } from '@dmr.is/official-journal/modules/comment'
import { PdfModule } from '@dmr.is/official-journal/modules/pdf'
import { PriceModule } from '@dmr.is/official-journal/modules/price'
import { SignatureModule } from '@dmr.is/official-journal/modules/signature'
import { UtilityModule } from '@dmr.is/official-journal/modules/utility'
import { ApplicationModule } from '@dmr.is/shared/modules/application'
import { AWSModule } from '@dmr.is/shared/modules/aws'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { OfficialJournalApplicationController } from './ojoi-application.controller'
import { OfficialJournalApplicationService } from './ojoi-application.service'
import { IOfficialJournalApplicationService } from './ojoi-application.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      CaseHistoryModel,
      CaseModel,
      CaseCommunicationStatusModel,
    ]),
    ApplicationModule,
    PriceModule,
    CommentModule,
    AWSModule,
    AttachmentModule,
    LoggingModule,
    SignatureModule,
    PdfModule,
    UtilityModule,
    AdvertTypeModule,
    AdvertModule,
    CaseModule,
  ],
  providers: [
    {
      provide: IOfficialJournalApplicationService,
      useClass: OfficialJournalApplicationService,
    },
  ],
  controllers: [OfficialJournalApplicationController],
  exports: [],
})
export class OJOIApplicationModule {}
