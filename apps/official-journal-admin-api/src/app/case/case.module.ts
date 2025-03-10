import { LoggingModule } from '@dmr.is/logging'
import {
  AdvertTypeAdminController,
  AdvertTypeController,
  AdvertTypeModule,
  CommentModuleV2,
  InstitutionAdminController,
  InstitutionController,
  InstitutionModule,
  SharedCaseModule,
  SharedJournalModule,
  SignatureController,
  SignatureModule,
  UserModule,
} from '@dmr.is/modules'

import { Module } from '@nestjs/common'

import { CaseController } from './case.controller'

@Module({
  imports: [
    LoggingModule,
    SharedCaseModule,
    SharedJournalModule,
    CommentModuleV2,
    SignatureModule,
    InstitutionModule,
    AdvertTypeModule,
    UserModule,
  ],
  controllers: [
    CaseController,
    AdvertTypeAdminController,
    SignatureController,
    AdvertTypeController,
    InstitutionController,
    InstitutionAdminController,
  ],
})
export class CaseModule {}
