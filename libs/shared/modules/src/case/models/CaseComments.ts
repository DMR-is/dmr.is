import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { CaseDto } from './Case'
import { CaseCommentDto } from './CaseComment'

@Table({ tableName: 'case_comments', timestamps: true })
export class CaseCommentsDto extends Model {
  @PrimaryKey
  @ForeignKey(() => CaseDto)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
  })
  case_id!: string

  @PrimaryKey
  @ForeignKey(() => CaseCommentDto)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
  })
  case_comment_id!: string

  @BelongsTo(() => CaseDto)
  case!: CaseDto

  @BelongsTo(() => CaseCommentDto)
  case_comment!: CaseCommentDto
}
