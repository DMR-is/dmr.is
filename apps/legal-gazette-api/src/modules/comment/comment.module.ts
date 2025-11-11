import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../models/advert.model'
import { StatusModel } from '../../models/status.model'
import { UserModel } from '../../models/users.model'
import { CommentListener } from './listeners/comment.listener'
import { CommentController } from './comment.controller'
import { CommentModel } from '../../models/comment.model'
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
