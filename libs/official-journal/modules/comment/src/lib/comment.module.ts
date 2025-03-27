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
