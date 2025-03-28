import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { CommentService } from './comment.service'
import { ICommentService } from './comment.service.interface'
import {
  CaseModel,
  CommentModel,
  CommentsModel,
  CaseActionModel,
} from '@dmr.is/official-journal/models'
import { AWSModule } from '@dmr.is/shared/modules/aws'

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
