import { Column, DataType, Model, Table } from 'sequelize-typescript'

import { AdvertFeeType } from '@dmr.is/shared/dto'

@Table({ tableName: 'application_fee_codes', timestamps: false })
export class TransactionFeeCodesModel extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({ type: DataType.STRING, allowNull: false })
  feeCode!: string

  @Column({ type: DataType.STRING, allowNull: false })
  department!: string

  @Column({ type: DataType.STRING, allowNull: false })
  description!: string

  @Column({
    type: DataType.ENUM(...Object.values(AdvertFeeType)),
    allowNull: false,
  })
  feeType!: AdvertFeeType

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    get() {
      const value = this.getDataValue('value')
      return value !== null ? parseFloat(value) : null
    },
  })
  value!: number
}
