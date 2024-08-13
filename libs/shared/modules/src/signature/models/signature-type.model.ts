import { Column, DataType, Model, Table } from 'sequelize-typescript'

@Table({ tableName: 'signature_type', timestamps: false })
export class SignatureTypeModel extends Model {
  @Column({
    type: DataType.UUID,
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
