import { LoggingModule } from '@dmr.is/logging'
import {
  AdminUserModule,
  AdvertTypeAdminController,
  AdvertTypeController,
  AdvertTypeModule,
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
    AdminUserModule,
    AdvertTypeModule,
  ],
  controllers: [
    CaseController,
    SignatureController,
    AdvertTypeController,
    AdvertTypeAdminController,
  ],
})
export class CaseModule {}
