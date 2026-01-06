import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
} from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'
import { SubscriberModel } from './subscriber.model'

/**
 * TBR payment status for tracking external API call state.
 * - PENDING: Record created, TBR API not yet called
 * - CREATED: TBR API call succeeded
 * - FAILED: TBR API call failed (can be retried)
 * - PAID: Payment confirmed
 */
export enum SubscriberPaymentStatus {
  PENDING = 'PENDING',
  CREATED = 'CREATED',
  FAILED = 'FAILED',
  PAID = 'PAID',
}

export type SubscriberPaymentAttributes = {
  subscriberId: string
  activatedByNationalId: string
  amount: number
  chargeBase: string
  chargeCategory: string
  feeCode: string
  paidAt: Date | null
  status: SubscriberPaymentStatus
  tbrReference: string | null
  tbrError: string | null
}

export type SubscriberPaymentCreateAttributes = Omit<
  SubscriberPaymentAttributes,
  'status' | 'tbrReference' | 'tbrError'
> & {
  status?: SubscriberPaymentStatus
  tbrReference?: string | null
  tbrError?: string | null
}

@BaseTable({ tableName: LegalGazetteModels.SUBSCRIBER_PAYMENT })
export class SubscriberPaymentModel extends BaseModel<
  SubscriberPaymentAttributes,
  SubscriberPaymentCreateAttributes
> {
  @Column({ type: DataType.UUID, allowNull: false, field: 'subscriber_id' })
  @ForeignKey(() => SubscriberModel)
  subscriberId!: string

  @Column({ type: DataType.STRING, allowNull: false, field: 'activated_by_national_id' })
  activatedByNationalId!: string

  @Column({ type: DataType.NUMBER, allowNull: false })
  amount!: number

  @Column({ type: DataType.STRING, allowNull: false })
  chargeBase!: string

  @Column({ type: DataType.STRING, allowNull: false })
  chargeCategory!: string

  @Column({ type: DataType.STRING, allowNull: false })
  feeCode!: string

  @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
  paidAt!: Date | null

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: SubscriberPaymentStatus.PENDING,
  })
  status!: SubscriberPaymentStatus

  @Column({ type: DataType.STRING, allowNull: true, field: 'tbr_reference' })
  tbrReference!: string | null

  @Column({ type: DataType.STRING, allowNull: true, field: 'tbr_error' })
  tbrError!: string | null

  @BelongsTo(() => SubscriberModel)
  subscriber!: SubscriberModel
}
