import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
} from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'
import { SubscriberModel } from './subscriber.model'
import { TBRTransactionModel } from './tbr-transactions.model'

export type SubscriberTransactionAttributes = {
  subscriberId: string
  transactionId: string
  activatedByNationalId: string
  isCurrent: boolean
}

export type SubscriberTransactionCreateAttributes = Omit<
  SubscriberTransactionAttributes,
  'isCurrent'
> & {
  isCurrent?: boolean
}

@BaseTable({ tableName: LegalGazetteModels.SUBSCRIBER_TRANSACTION })
export class SubscriberTransactionModel extends BaseModel<
  SubscriberTransactionAttributes,
  SubscriberTransactionCreateAttributes
> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'subscriber_id',
  })
  @ForeignKey(() => SubscriberModel)
  subscriberId!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'transaction_id',
  })
  @ForeignKey(() => TBRTransactionModel)
  transactionId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'activated_by_national_id',
  })
  activatedByNationalId!: string

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_current',
  })
  isCurrent!: boolean

  @BelongsTo(() => SubscriberModel)
  subscriber!: SubscriberModel

  @BelongsTo(() => TBRTransactionModel)
  transaction!: TBRTransactionModel
}
