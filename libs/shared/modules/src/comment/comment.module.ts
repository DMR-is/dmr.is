import { LoggingModule } from '@dmr.is/logging'

import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApplicationModule } from '../application/application.module'
import caseModels from '../case/models'
import { UtilityModule } from '../utility/utility.module'
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
    forwardRef(() => ApplicationModule),
    forwardRef(() => UtilityModule),
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
