import { LoggingModule } from '@dmr.is/logging'
import {
  AdminUserModule,
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
  ],
  controllers: [CaseController, SignatureController],
})
export class CaseModule {}
