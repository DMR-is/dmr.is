import { Column, DataType, DefaultScope } from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { Subscription } from '../../guards/subscriber/subscriber.enum'
import { SubscriberDto } from './dto/subscriber.dto'

export type SubscriberAttributes = {
  id: string
  nationalId: string
  firstName: string
  lastName: string
  email: string
  phone: string
}

export type SubscriberCreateAttributes = {
  id?: string
  nationalId: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
}

@BaseTable({ tableName: LegalGazetteModels.SUBSCRIBER })
@DefaultScope(() => ({
  attributes: ['id', 'nationalId', 'isActive'],
}))
export class SubscriberModel extends BaseModel<
  SubscriberAttributes,
  SubscriberCreateAttributes
> {
  @Column({
    type: DataType.TEXT,
    field: 'national_id',
    allowNull: false,
    unique: true,
  })
  nationalId!: string

  @Column({
    type: DataType.BOOLEAN,
    field: 'is_active',
    allowNull: false,
    defaultValue: true,
  })
  isActive!: boolean

  static fromModel(model: SubscriberModel): SubscriberDto {
    return {
      id: model.id,
      nationalId: model.nationalId,
      role: model.isActive ? Subscription.ACTIVE : Subscription.INACTIVE,
    }
  }

  fromModel() {
    return SubscriberModel.fromModel(this)
  }
}
