import { Column, DataType, Model, Table } from 'sequelize-typescript'

@Table({ tableName: 'signature_member', timestamps: false })
export class SignatureMemberModel extends Model {
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
    field: 'value',
  })
  text!: string

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'text_above',
  })
  textAbove?: string

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'text_below',
  })
  textBelow?: string

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'text_after',
  })
  textAfter?: string
}
