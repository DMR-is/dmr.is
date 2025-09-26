import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { AdvertModel } from '../advert/advert.model'
import { FeeCodeModel } from '../fee-code/fee-code.model'

export type TBRTransactionAttributes = {
  advertId: string
  feeCodeId: string
  totalPrice: number
  feeCodeMultiplier: number
}

export type TBRTransactionCreateAttributes = TBRTransactionAttributes

@BaseTable({ tableName: LegalGazetteModels.TBR_TRANSACTION })
export class TBRTransactionModel extends BaseModel<
  TBRTransactionAttributes,
  TBRTransactionCreateAttributes
> {
  @Column({ type: DataType.UUID, unique: true, allowNull: false })
  @ForeignKey(() => AdvertModel)
  advertId!: string

  @Column({ type: DataType.UUID, allowNull: false })
  @ForeignKey(() => FeeCodeModel)
  feeCodeId!: string

  @Column({ type: DataType.NUMBER, allowNull: false })
  totalPrice!: number

  @Column({ type: DataType.NUMBER, allowNull: false, defaultValue: 1 })
  feeCodeMultiplier!: number

  @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
  paidAt!: Date | null

  @BelongsTo(() => AdvertModel)
  advert!: AdvertModel

  @BelongsTo(() => FeeCodeModel)
  feeCode!: FeeCodeModel
}
