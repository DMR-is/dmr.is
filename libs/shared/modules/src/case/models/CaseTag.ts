import {
  Column,
  DataType,
  DefaultScope,
  Model,
  Table,
} from 'sequelize-typescript'

@Table({ tableName: 'case_tag', timestamps: false })
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class CaseTagDto extends Model {
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
  title!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  slug!: string
}
