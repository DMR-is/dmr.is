import { Column, DataType, Model, Table } from 'sequelize-typescript'

@Table({ tableName: 'case_comment', timestamps: true })
export class CaseCommentDto extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string
}
