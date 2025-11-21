import { Module } from '@nestjs/common'

import { LoggingModule } from '@dmr.is/logging'
import {
  AdvertTypeAdminController,
  AdvertTypeController,
  AdvertTypeModule,
  CommentModuleV2,
  InstitutionAdminController,
  InstitutionController,
  InstitutionModule,
  PriceModule,
  SharedCaseModule,
  SharedJournalModule,
  SignatureController,
  SignatureModule,
  UserController,
  UserModule,
} from '@dmr.is/modules'

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
    PriceModule,
  ],
  controllers: [
    CaseController,
    AdvertTypeAdminController,
    SignatureController,
    AdvertTypeController,
    InstitutionController,
    InstitutionAdminController,
    UserController,
  ],
})
export class CaseModule {}
