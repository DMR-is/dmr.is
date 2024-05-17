import { LoggingModule } from '@dmr.is/logging'
import { CommentModule, SharedCaseModule } from '@dmr.is/modules'

import { Module } from '@nestjs/common'

import { CaseController } from './case.controller'

@Module({
  imports: [LoggingModule, SharedCaseModule, CommentModule],
  controllers: [CaseController],
})
export class CaseModule {}
