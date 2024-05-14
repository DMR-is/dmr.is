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

import { CaseDto } from './Case'
import { CaseCommentDto } from './CaseComment'

@Table({ tableName: 'case_comments', timestamps: false })
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class CaseCommentsDto extends Model {
  @PrimaryKey
  @ForeignKey(() => CaseDto)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'case_case_id',
  })
  case_id!: string

  @PrimaryKey
  @ForeignKey(() => CaseCommentDto)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
  })
  case_comment_id!: string

  @BelongsTo(() => CaseDto, 'case_case_id')
  case!: CaseDto

  @BelongsTo(() => CaseCommentDto, 'case_comment_id')
  case_comment!: CaseCommentDto
}
