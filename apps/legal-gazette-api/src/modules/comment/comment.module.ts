import { Module } from '@nestjs/common'

import { CommentModule } from '../../services/comment/comment.module'
import { CommentController } from './comment.controller'

@Module({
  imports: [CommentModule],
  providers: [],
  controllers: [CommentController],
  exports: [],
})
export class CommentControllerModule {}
