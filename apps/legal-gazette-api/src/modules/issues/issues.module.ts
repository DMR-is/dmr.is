import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../models/advert.model'
import { CommentModel } from '../../models/comment.model'
import { IssuesController } from './issues.controller'
import { IssueModel } from './issues.model'
import { IssuesService } from './issues.service'
import { IIssuesService } from './issues.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([AdvertModel, CommentModel, IssueModel]),
  ],
  controllers: [IssuesController],
  providers: [
    {
      provide: IIssuesService,
      useClass: IssuesService,
    },
  ],
  exports: [IIssuesService],
})
export class IssuesModule {}
