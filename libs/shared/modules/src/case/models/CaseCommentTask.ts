import { BelongsTo, Column, DataType, Model, Table } from 'sequelize-typescript'

import { CaseCommentTitleDto } from './CaseCommentTitle'

@Table({ tableName: 'case_comment_task', timestamps: true })
export class CaseCommentTaskDto extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'from_id',
  })
  fromId!: string | null

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'to_id',
  })
  toId!: string | null

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'title_id',
  })
  titleId!: string | null

  @BelongsTo(() => CaseCommentTitleDto, 'title_id')
  title!: CaseCommentTitleDto

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  comment!: string | null
}
