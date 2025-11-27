import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertPublicationModel } from '../../../../models/advert-publication.model'
import { IssueModel } from '../../../../models/issues.model'
import { PdfProviderModule } from '../../pdf/pdf.provider.module'
import { IssuesTaskService } from './issues.task'
import { IIssuesTask } from './issues.task.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([IssueModel, AdvertPublicationModel]),
    PdfProviderModule,
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
