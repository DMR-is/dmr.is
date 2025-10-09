import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { StatusModel } from '../status/status.model'
import { UserModel } from '../users/users.model'
import { CommentModel } from './comment.model'
import { CommentService } from './comment.service'
import { ICommentService } from './comment.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([CommentModel, UserModel, StatusModel])],
  providers: [
    {
      provide: ICommentService,
      useClass: CommentService,
    },
  ],
  controllers: [],
  exports: [ICommentService],
})
export class CommentModule {}
