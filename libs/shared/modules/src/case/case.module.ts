import { LoggingModule } from '@dmr.is/logging'

import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApplicationModule } from '../application/application.module'
import { CommentModule } from '../comment/comment.module'
import commentModels from '../comment/models'
import { SharedJournalModule } from '../journal/journal.module'
import { AdvertDepartmentDTO } from '../journal/models'
import { UtilityModule } from '../utility/utility.module'
import { CaseService } from './case.service'
import { ICaseService } from './case.service.interface'
import { CaseServiceMock } from './case.service.mock'
import caseModels from './models'
import {
  CaseCommunicationStatusDto,
  CaseDto,
  CaseStatusDto,
  CaseTagDto,
} from './models'

export {
  ICaseService,
  CaseService,
  CaseServiceMock,
  caseModels,
  CaseDto,
  CaseTagDto,
  CaseStatusDto,
  CaseCommunicationStatusDto,
}

const API_MOCK = process.env.API_MOCK === 'true'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ...commentModels,
      ...caseModels,
      AdvertDepartmentDTO,
    ]),
    LoggingModule,
    SharedJournalModule,
    forwardRef(() => CommentModule),
    forwardRef(() => UtilityModule),
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
