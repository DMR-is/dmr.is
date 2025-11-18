import { Module } from '@nestjs/common'

import { CommentController } from './comment.controller'
import { CommentProviderModule } from './comment.provider.module'

@Module({
  imports: [CommentProviderModule],
  providers: [],
  controllers: [CommentController],
  exports: [],
})
export class CommentControllerModule {}
