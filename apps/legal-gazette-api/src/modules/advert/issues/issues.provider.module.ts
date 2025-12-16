import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../../models/advert.model'
import { CommentModel } from '../../../models/comment.model'
import { IssueModel } from '../../../models/issues.model'
import { IssuesService } from './issues.service'
import { IIssuesService } from './issues.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([AdvertModel, CommentModel, IssueModel]),
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
