import {
  CaseActionModel,
  CaseModel,
  CommentModel,
  CommentsModel,
} from '@dmr.is/official-journal/models'
import { AWSModule } from '@dmr.is/shared/modules/aws'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

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
    AWSModule,
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
