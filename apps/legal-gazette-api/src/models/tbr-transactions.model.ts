import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
} from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'
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

/**
 * Transaction type to distinguish between advert and subscription payments.
 */
export enum TBRTransactionType {
  ADVERT = 'ADVERT',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

export type TBRTransactionAttributes = {
  transactionType: TBRTransactionType
  feeCodeId: string
  totalPrice: number
  feeCodeMultiplier: number
  chargeBase: string
  chargeCategory: string
  debtorNationalId: string
  paidAt: Date | null
  status: TBRTransactionStatus
  tbrReference: string | null
  tbrError: string | null
}

export type TBRTransactionCreateAttributes = Omit<
  TBRTransactionAttributes,
  'paidAt' | 'status' | 'tbrReference' | 'tbrError' | 'feeCodeMultiplier'
> & {
  paidAt?: Date | null
  status?: TBRTransactionStatus
  tbrReference?: string | null
  tbrError?: string | null
  feeCodeMultiplier?: number
}

@BaseTable({ tableName: LegalGazetteModels.TBR_TRANSACTION })
export class TBRTransactionModel extends BaseModel<
  TBRTransactionAttributes,
  TBRTransactionCreateAttributes
> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: TBRTransactionType.ADVERT,
    field: 'transaction_type',
  })
  transactionType!: TBRTransactionType

  @Column({ type: DataType.UUID, allowNull: false, field: 'fee_code_id' })
  @ForeignKey(() => FeeCodeModel)
  feeCodeId!: string

  @Column({ type: DataType.NUMBER, allowNull: false, field: 'total_price' })
  totalPrice!: number

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    defaultValue: 1,
    field: 'fee_code_multiplier',
  })
  feeCodeMultiplier!: number

  @Column({ type: DataType.DATE, allowNull: true, defaultValue: null, field: 'paid_at' })
  paidAt!: Date | null

  @Column({ type: DataType.STRING, allowNull: false, field: 'charge_base' })
  chargeBase!: string

  @Column({ type: DataType.STRING, allowNull: false, field: 'charge_category' })
  chargeCategory!: string

  @Column({ type: DataType.STRING, allowNull: false, field: 'debtor_national_id' })
  debtorNationalId!: string

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

  @BelongsTo(() => FeeCodeModel)
  feeCode!: FeeCodeModel

  // Note: Relation to SubscriberTransactionModel is defined there to avoid circular imports
  // Note: Relation to AdvertModel is now from AdvertModel.transactionId
}
