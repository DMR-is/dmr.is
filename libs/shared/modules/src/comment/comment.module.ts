import { LoggingModule } from '@dmr.is/logging'

import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApplicationModule } from '../application/application.module'
import caseModels from '../case/models'
import { UtilityModule } from '../utility/utility.module'
import { CommentService } from './comment.service'
import { ICommentService } from './comment.service.interface'
import commentModels, {
  CaseCommentModel,
  CaseCommentsModel,
  CaseCommentTaskModel,
  CaseCommentTitleModel,
  CaseCommentTypeModel,
} from './models'

export {
  CommentService,
  ICommentService,
  commentModels,
  CaseCommentModel,
  CaseCommentsModel,
  CaseCommentTypeModel,
  CaseCommentTaskModel,
  CaseCommentTitleModel,
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
