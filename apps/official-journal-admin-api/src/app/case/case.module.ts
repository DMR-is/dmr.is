import { LoggingModule } from '@dmr.is/logging'
import {
  CommentModule,
  SharedCaseModule,
  SharedJournalModule,
} from '@dmr.is/modules'

import { Module } from '@nestjs/common'

import { CaseController } from './case.controller'

@Module({
  imports: [
    LoggingModule,
    SharedCaseModule,
    SharedJournalModule,
    CommentModule,
  ],
  controllers: [CaseController],
})
export class CaseModule {}
