import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Scopes,
} from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'
import { AdvertModel } from './advert.model'
import { FeeCodeModel } from './fee-code.model'

/**
 * TBR transaction status for tracking external API call state.
 * - PENDING: Record created, TBR API not yet called
 * - CREATED: TBR API call succeeded
 * - FAILED: TBR API call failed (can be retried)
 * - PAID: Payment confirmed
 */
export enum TBRTransactionStatus {
  PENDING = 'PENDING',
  CREATED = 'CREATED',
  FAILED = 'FAILED',
  PAID = 'PAID',
}

export type TBRTransactionAttributes = {
  advertId: string
  feeCodeId: string
  totalPrice: number
  feeCodeMultiplier: number
  chargeBase: string
  chargeCategory: string
  paidAt: Date | null
  status: TBRTransactionStatus
  tbrReference: string | null
  tbrError: string | null
}

export type TBRTransactionCreateAttributes = Omit<
  TBRTransactionAttributes,
  'paidAt' | 'status' | 'tbrReference' | 'tbrError'
> & {
  paidAt?: Date | null
  status?: TBRTransactionStatus
  tbrReference?: string | null
  tbrError?: string | null
}

@BaseTable({ tableName: LegalGazetteModels.TBR_TRANSACTION })
@Scopes(() => ({
  withDebtor: {
    include: [
      {
        model: AdvertModel,
        attributes: ['id', 'createdByNationalId'],
      },
    ],
  },
}))
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

  @Column({ type: DataType.STRING, allowNull: false })
  chargeBase!: string

  @Column({ type: DataType.STRING, allowNull: false })
  chargeCategory!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: TBRTransactionStatus.PENDING,
  })
  status!: TBRTransactionStatus

  @Column({ type: DataType.STRING, allowNull: true, field: 'tbr_reference' })
  tbrReference!: string | null

  @Column({ type: DataType.STRING, allowNull: true, field: 'tbr_error' })
  tbrError!: string | null

  @BelongsTo(() => AdvertModel)
  advert!: AdvertModel

  @BelongsTo(() => FeeCodeModel)
  feeCode!: FeeCodeModel
}
