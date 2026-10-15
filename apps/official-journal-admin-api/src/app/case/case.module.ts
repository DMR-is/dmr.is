import { Module } from '@nestjs/common'

import { LoggingModule } from '@dmr.is/logging'
import {
  AdvertTypeAdminController,
  AdvertTypeController,
  AdvertTypeModule,
  ApplicationModule,
  CommentModuleV2,
  InstitutionAdminController,
  InstitutionController,
  InstitutionModule,
  OpenSearchModule,
  PriceModule,
  SharedCaseModule,
  SharedJournalModule,
  SignatureController,
  SignatureModule,
  UserController,
  UserModule,
} from '@dmr.is/ojoi-modules'

import { ApplicationController } from '../application/application.controller'
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
    ApplicationModule,
    OpenSearchModule,
  ],
  controllers: [
    CaseController,
    ApplicationController,
    AdvertTypeAdminController,
    SignatureController,
    AdvertTypeController,
    InstitutionController,
    InstitutionAdminController,
    UserController,
  ],
})
export class CaseModule {}
