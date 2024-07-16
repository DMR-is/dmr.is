import { LoggingModule } from '@dmr.is/logging'
import {
  CommentModule,
  PdfModule,
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
    PdfModule,
  ],
  controllers: [CaseController],
})
export class CaseModule {}
