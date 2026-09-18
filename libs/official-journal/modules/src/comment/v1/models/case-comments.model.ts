// Association annotations use a type-only alias - see `src/models.md`.
import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import type { CaseModel as CaseModelRef } from '../../../case/models'
import { CaseModel } from '../../../case/models'
import type { CaseCommentModel as CaseCommentModelRef } from './case-comment.model'
import { CaseCommentModel } from './case-comment.model'

@Table({ tableName: 'case_comments', timestamps: false })
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class CaseCommentsModel extends Model {
  @PrimaryKey
  @ForeignKey(() => CaseModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'case_case_id',
  })
  caseId!: string

  @PrimaryKey
  @ForeignKey(() => CaseCommentModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'case_comment_id',
  })
  commentId!: string

  @BelongsTo(() => CaseModel)
  case!: CaseModelRef

  @BelongsTo(() => CaseCommentModel)
  caseComment!: CaseCommentModelRef
}
