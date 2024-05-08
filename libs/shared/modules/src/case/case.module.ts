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
import { models } from './models'

export { ICaseService } from './case.service.interface'
export { CaseServiceMock } from './case.service.mock'
export { CaseService } from './case.service'

const API_MOCK = process.env.API_MOCK === 'true'

@Module({
  imports: [
    LoggingModule,
    SharedJournalModule,
    forwardRef(() => ApplicationModule),
    SequelizeModule.forFeature([...models]),
  ],
  controllers: [],
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
  exports: [ICaseService],
})
export class SharedCaseModule {}
