import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { caseModels } from '../case/case.module'
import { CommentService } from './comment.service'
import { ICommentService } from './comment.service.interface'
import { models as commentModels } from './models'

export { CommentService, ICommentService, commentModels }

@Module({
  imports: [
    SequelizeModule.forFeature([...caseModels, ...commentModels]),
    LoggingModule,
  ],
  providers: [
    {
      provide: ICommentService,
      useClass: CommentService,
    },
  ],
  exports: [ICommentService],
})
export class CommentModule {}
