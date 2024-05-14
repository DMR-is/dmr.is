import {
  Column,
  DataType,
  DefaultScope,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

@Table({ tableName: 'case_comment_title', timestamps: false })
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class CaseCommentTitleDto extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

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
