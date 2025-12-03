import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../../models/advert.model'
import { CommentModel } from '../../../models/comment.model'
import { IssueModel } from '../../../models/issues.model'
import { IssusesTaskModule } from '../tasks/issues/issues.task.module'
import { IssuesService } from './issues.service'
import { IIssuesService } from './issues.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([AdvertModel, CommentModel, IssueModel]),
    IssusesTaskModule,
  ],
  controllers: [],
  providers: [
    {
      provide: IIssuesService,
      useClass: IssuesService,
    },
  ],
  exports: [IIssuesService],
})
export class IssuesProviderModule {}
