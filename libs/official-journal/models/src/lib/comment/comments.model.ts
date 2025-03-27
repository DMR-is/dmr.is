import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { CommentModel } from './comment.model'
import { OfficialJournalModels } from '../constants'
import { CaseModel } from '../case/case.model'

@Table({ tableName: OfficialJournalModels.COMMENTS, timestamps: false })
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
