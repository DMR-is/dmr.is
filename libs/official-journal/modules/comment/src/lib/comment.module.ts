import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AwsModule } from '../../aws/aws'
import { CaseModel } from '../../case/models/case.model'
import { CaseActionModel } from './models/case-action.model'
import { CommentModel } from './models/comment.model'
import { CommentsModel } from './models/comments.model'
import { CommentService } from './comment.service'
import { ICommentService } from './comment.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      CaseModel,
      CommentModel,
      CommentsModel,
      CaseActionModel,
    ]),
    AwsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: ICommentService,
      useClass: CommentService,
    },
  ],
  exports: [ICommentService],
})
export class CommentModule {}
