import { LoggingModule } from '@dmr.is/logging'

import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApplicationModule } from '../application/application.module'
import { SharedJournalModule } from '../journal/journal.module'
import { CaseCommentService } from './services/comment/comment.service'
import { ICaseCommentService } from './services/comment/comment.service.interface'
import { CaseService } from './case.service'
import { ICaseService } from './case.service.interface'
import { CaseServiceMock } from './case.service.mock'
import {
  CaseCommentDto,
  CaseCommentsDto,
  CaseCommentTaskDto,
  CaseCommentTitleDto,
  CaseCommentTypeDto,
  CaseCommunicationStatusDto,
  CaseDto,
  CaseStatusDto,
  CaseTagDto,
  models as caseModels,
} from './models'

export {
  CaseDto,
  CaseTagDto,
  CaseStatusDto,
  CaseCommentDto,
  CaseCommentsDto,
  CaseCommentTypeDto,
  CaseCommentTaskDto,
  CaseCommentTitleDto,
  CaseCommunicationStatusDto,
}

export {
  ICaseService,
  ICaseCommentService,
  CaseService,
  CaseCommentService,
  CaseServiceMock,
  caseModels,
}

const API_MOCK = process.env.API_MOCK === 'true'

@Module({
  imports: [
    SequelizeModule.forFeature([...caseModels]),
    LoggingModule,
    SharedJournalModule,
    forwardRef(() => ApplicationModule),
  ],
  providers: [
    {
      provide: ICaseService,
      useClass: API_MOCK ? CaseServiceMock : CaseService,
    },
    {
      provide: ICaseCommentService,
      useClass: CaseCommentService,
    },
  ],
  exports: [ICaseService, ICaseCommentService],
})
export class SharedCaseModule {}
