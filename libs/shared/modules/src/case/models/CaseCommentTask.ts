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
    type: DataType.STRING,
    allowNull: true,
  })
  from!: string | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  to!: string | null

  @BelongsTo(() => CaseCommentTitleDto)
  title!: CaseCommentTitleDto
}
