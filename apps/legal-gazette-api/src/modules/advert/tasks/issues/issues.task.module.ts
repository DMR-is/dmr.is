import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertPublicationModel } from '../../../../models/advert-publication.model'
import { IssueModel } from '../../../../models/issues.model'
import { IssueSettingsModel } from '../../../../models/issues-settings.model'
import { PdfProviderModule } from '../../pdf/pdf.provider.module'
import { PgAdvisoryLockModule } from '../lock.module'
import { IssuesTaskService } from './issues.task'
import { IIssuesTask } from './issues.task.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      IssueModel,
      IssueSettingsModel,
      AdvertPublicationModel,
    ]),
    PdfProviderModule,
    PgAdvisoryLockModule,
  ],
  providers: [
    {
      provide: IIssuesTask,
      useClass: IssuesTaskService,
    },
  ],
  exports: [IIssuesTask],
})
export class IssusesTaskModule {}
