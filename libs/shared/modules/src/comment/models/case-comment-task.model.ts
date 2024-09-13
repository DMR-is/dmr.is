import { BelongsTo, Column, DataType, Model, Table } from 'sequelize-typescript'

import { CaseCommentTitleModel } from './case-comment-title.model'

@Table({ tableName: 'case_comment_task', timestamps: false })
export class CaseCommentTaskModel extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  comment!: string | null

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
    field: 'title_id',
  })
  titleId!: string

  @BelongsTo(() => CaseCommentTitleModel, 'title_id')
  title!: CaseCommentTitleModel
}
