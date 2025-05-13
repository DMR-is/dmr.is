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
import { createRedisCacheOptions } from '@dmr.is/utils/cache'

import { Module } from '@nestjs/common'

import { CaseController } from './case.controller'

@Module({
  imports: [
    createRedisCacheOptions('ojoi-case'),
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
