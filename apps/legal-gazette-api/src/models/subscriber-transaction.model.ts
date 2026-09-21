// Association annotations use a type-only alias - see `models.md`.
import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { ParanoidModel, ParanoidTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
import type { SubscriberModel as SubscriberModelRef } from './subscriber.model'
import { SubscriberModel } from './subscriber.model'
import type { TBRTransactionModel as TBRTransactionModelRef } from './tbr-transactions.model'
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

@ParanoidTable({ tableName: LegalGazetteModels.SUBSCRIBER_TRANSACTION })
export class SubscriberTransactionModel extends ParanoidModel<
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
  subscriber!: SubscriberModelRef

  @BelongsTo(() => TBRTransactionModel)
  transaction!: TBRTransactionModelRef
}
