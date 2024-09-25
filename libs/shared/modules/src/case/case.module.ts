import { LoggingModule } from '@dmr.is/logging'

import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApplicationModule } from '../application/application.module'
import { AttachmentsModule } from '../attachments/attachments.module'
import { CommentModule } from '../comment/comment.module'
import commentModels from '../comment/models'
import { SharedJournalModule } from '../journal/journal.module'
import { AdvertDepartmentModel } from '../journal/models'
import advertModels from '../journal/models'
import { S3Module } from '../s3/s3.module'
import { SignatureModule } from '../signature/signature.module'
import { UtilityModule } from '../utility/utility.module'
import { CaseCreateService } from './services/create/case-create.service'
import { ICaseCreateService } from './services/create/case-create.service.interface'
import { CaseUpdateService } from './services/update/case-update.service'
import { ICaseUpdateService } from './services/update/case-update.service.interface'
import { CaseService } from './case.service'
import { ICaseService } from './case.service.interface'
import { CaseServiceMock } from './case.service.mock'
import caseModels from './models'
import {
  CaseCommunicationStatusModel,
  CaseModel,
  CaseStatusModel,
  CaseTagModel,
} from './models'

export {
  ICaseService,
  CaseService,
  CaseServiceMock,
  caseModels,
  CaseModel,
  CaseTagModel,
  CaseStatusModel,
  CaseCommunicationStatusModel,
}

const API_MOCK = process.env.API_MOCK === 'true'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ...commentModels,
      ...caseModels,
      ...advertModels,
      AdvertDepartmentModel,
    ]),
    LoggingModule,
    SharedJournalModule,
    SignatureModule,
    forwardRef(() => S3Module),
    forwardRef(() => AttachmentsModule),
    forwardRef(() => CommentModule),
    forwardRef(() => UtilityModule),
    forwardRef(() => ApplicationModule),
    forwardRef(() => SharedJournalModule),
  ],
  providers: [
    {
      provide: ICaseService,
      useClass: API_MOCK ? CaseServiceMock : CaseService,
    },
    {
      provide: ICaseUpdateService,
      useClass: CaseUpdateService,
    },
    {
      provide: ICaseCreateService,
      useClass: CaseCreateService,
    },
  ],
  exports: [ICaseService],
})
export class SharedCaseModule {}
