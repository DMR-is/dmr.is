import { LoggingModule } from '@dmr.is/logging'

import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApplicationModule } from '../application/application.module'
import { CommentModule } from '../comment/comment.module'
import { SharedJournalModule } from '../journal/journal.module'
import { UtilityModule } from '../utility/utility.module'
import { CaseService } from './case.service'
import { ICaseService } from './case.service.interface'
import { CaseServiceMock } from './case.service.mock'
import {
  CaseDto,
  CaseStatusDto,
  CaseTagDto,
  models as caseModels,
} from './models'

export { CaseDto, CaseTagDto, CaseStatusDto }

export { ICaseService, CaseService, CaseServiceMock, caseModels }

const API_MOCK = process.env.API_MOCK === 'true'

@Module({
  imports: [
    SequelizeModule.forFeature([...caseModels]),
    LoggingModule,
    SharedJournalModule,
    CommentModule,
    UtilityModule,
    forwardRef(() => ApplicationModule),
  ],
  providers: [
    {
      provide: ICaseService,
      useClass: API_MOCK ? CaseServiceMock : CaseService,
    },
  ],
  exports: [ICaseService],
})
export class SharedCaseModule {}
