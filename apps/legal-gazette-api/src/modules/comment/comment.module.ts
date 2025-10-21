import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../advert/advert.model'
import { StatusModel } from '../status/status.model'
import { UserModel } from '../users/users.model'
import { CommentListener } from './listeners/comment.listener'
import { CommentController } from './comment.controller'
import { CommentModel } from './comment.model'
import { CommentService } from './comment.service'
import { ICommentService } from './comment.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      CommentModel,
      UserModel,
      StatusModel,
      AdvertModel,
    ]),
  ],
  providers: [
    CommentListener,
    {
      provide: ICommentService,
      useClass: CommentService,
    },
  ],
  controllers: [CommentController],
  exports: [ICommentService],
})
export class CommentModule {}
