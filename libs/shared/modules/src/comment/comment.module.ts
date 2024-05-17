import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import caseModels from '../case/models'
import { CommentService } from './comment.service'
import { ICommentService } from './comment.service.interface'
import commentModels, {
  CaseCommentDto,
  CaseCommentsDto,
  CaseCommentTaskDto,
  CaseCommentTitleDto,
  CaseCommentTypeDto,
} from './models'

export {
  CommentService,
  ICommentService,
  commentModels,
  CaseCommentDto,
  CaseCommentsDto,
  CaseCommentTypeDto,
  CaseCommentTaskDto,
  CaseCommentTitleDto,
}

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
