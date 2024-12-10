import { LoggingModule } from '@dmr.is/logging'
import {
  AdminUserController,
  AdminUserModule,
  ApplicationUserController,
  ApplicationUserModule,
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
    ApplicationUserModule,
  ],
  controllers: [
    CaseController,
    SignatureController,
    AdminUserController,
    ApplicationUserController,
  ],
})
export class CaseModule {}
