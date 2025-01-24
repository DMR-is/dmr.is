import { LoggingModule } from '@dmr.is/logging'
import {
  AdminUserController,
  AdminUserModule,
  AdvertTypeAdminController,
  AdvertTypeController,
  AdvertTypeModule,
  ApplicationUserController,
  ApplicationUserModule,
  CommentModuleV1,
  InstitutionAdminController,
  InstitutionController,
  InstitutionModule,
  SharedCaseModule,
  SharedJournalModule,
  SignatureController,
  SignatureModule,
} from '@dmr.is/modules'

import { Module } from '@nestjs/common'

import { CaseController } from './case.controller'

@Module({
  imports: [
    LoggingModule,
    SharedCaseModule,
    SharedJournalModule,
    CommentModuleV1,
    SignatureModule,
    AdminUserModule,
    ApplicationUserModule,
    InstitutionModule,
    AdvertTypeModule,
  ],
  controllers: [
    CaseController,
    SignatureController,
    AdvertTypeController,
    AdvertTypeAdminController,
    AdminUserController,
    ApplicationUserController,
    InstitutionController,
    InstitutionAdminController,
  ],
})
export class CaseModule {}
