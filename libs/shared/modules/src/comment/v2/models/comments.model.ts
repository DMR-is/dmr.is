import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { CaseModel } from '../../../case/models'
import { CommentModel } from './comment.model'

@Table({ tableName: 'case_comments_v2', timestamps: false })
export class CommentsModel extends Model {
  @PrimaryKey
  @ForeignKey(() => CaseModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'case_id',
  })
  caseId!: string

  @PrimaryKey
  @ForeignKey(() => CommentModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'comment_v2_id',
  })
  commentId!: string

  @BelongsTo(() => CaseModel)
  case!: CaseModel

  @BelongsTo(() => CommentModel)
  caseComment!: CommentModel
}
