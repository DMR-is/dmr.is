import { Model } from 'sequelize'
import { Column, DataType, DefaultScope, Table } from 'sequelize-typescript'

@Table({ tableName: 'case_comment_title', timestamps: true })
export class CaseCommentTitleDto extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  id!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  key!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  value!: string
}
