import { LoggingModule } from '@dmr.is/logging'
import {
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
  ],
  controllers: [CaseController, SignatureController, AuthController],
})
export class CaseModule {}
