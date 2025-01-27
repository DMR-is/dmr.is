import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseModel } from '../../case/models'
import { CaseActionModel } from './models/case-action.model'
import { CommentModel } from './models/comment.model'
import { CommentServiceV2 } from './comment.service'
import { ICommentServiceV2 } from './comment.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([CaseModel, CommentModel, CaseActionModel]),
    LoggingModule,
  ],
  controllers: [],
  providers: [
    {
      provide: ICommentServiceV2,
      useClass: CommentServiceV2,
    },
  ],
  exports: [ICommentServiceV2],
})
export class CommentModuleV2 {}
