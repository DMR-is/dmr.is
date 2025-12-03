import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
} from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'
import { SubscriberModel } from './subscriber.model'

export type SubscriberPaymentAttributes = {
  subscriberId: string
  amount: number
  chargeBase: string
  chargeCategory: string
  feeCode: string
  paidAt: Date | null
}

export type SubscriberPaymentCreateAttributes = SubscriberPaymentAttributes

@BaseTable({ tableName: LegalGazetteModels.SUBSCRIBER_PAYMENT })
export class SubscriberPaymentModel extends BaseModel<
  SubscriberPaymentAttributes,
  SubscriberPaymentCreateAttributes
> {
  @Column({ type: DataType.UUID, unique: true, allowNull: false })
  @ForeignKey(() => SubscriberModel)
  subscriberId!: string

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

  @BelongsTo(() => SubscriberModel)
  subscriber!: SubscriberModel
}
