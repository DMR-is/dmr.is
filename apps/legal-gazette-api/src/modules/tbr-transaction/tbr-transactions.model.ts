import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { AdvertModel } from '../advert/advert.model'
import { FeeCodesModel } from '../fee-codes/fee-codes.model'

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
  @ForeignKey(() => FeeCodesModel)
  feeCodeId!: string

  @Column({ type: DataType.NUMBER, allowNull: false })
  totalPrice!: number

  @Column({ type: DataType.NUMBER, allowNull: false, defaultValue: 1 })
  feeCodeMultiplier!: number

  @BelongsTo(() => AdvertModel)
  advert!: AdvertModel

  @BelongsTo(() => FeeCodesModel)
  feeCode!: FeeCodesModel
}
