import { LoggingModule } from '@dmr.is/logging'
import {
  AdminUserModule,
  AdvertTypeAdminController,
  AdvertTypeController,
  AdvertTypeModule,
  AuthController,
  AuthModule,
  CommentModule,
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
    CommentModule,
    SignatureModule,
    AuthModule,
    AdminUserModule,
    AdvertTypeModule,
  ],
  controllers: [
    CaseController,
    SignatureController,
    AuthController,
    AdvertTypeController,
    AdvertTypeAdminController,
  ],
})
export class CaseModule {}
