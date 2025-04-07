import { Column, DataType, Model, Table } from 'sequelize-typescript'

import { OfficialJournalModels } from '../constants'

export enum AdvertFeeTypeEnum {
  Base = 'BASE',
  AdditionalDoc = 'ADDITIONAL_DOC',
  FastTrack = 'FAST_TRACK',
  BaseModifier = 'BASE_MODIFIER',
  CustomMultiplier = 'CUSTOM_MULTIPLIER',
  ImageTier = 'IMAGE_TIER',
  Lowererd = 'LOWERED',
  Percentage = 'PERCENTAGE',
}

@Table({
  tableName: OfficialJournalModels.TRANSACTION_FEE_CODES,
  timestamps: false,
})
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
    type: DataType.ENUM(...Object.values(AdvertFeeTypeEnum)),
    allowNull: false,
  })
  feeType!: AdvertFeeTypeEnum

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
