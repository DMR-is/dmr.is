import { Column, DataType, DefaultScope } from 'sequelize-typescript'

import { ApiProperty, PickType } from '@nestjs/swagger'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'
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
  isActive?: boolean
  email?: string | null
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
  @ApiProperty({ type: String })
  nationalId!: string

  @Column({
    type: DataType.BOOLEAN,
    field: 'is_active',
    allowNull: false,
    defaultValue: true,
  })
  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromModel(model: SubscriberModel): SubscriberDto {
    return {
      id: model.id,
      nationalId: model.nationalId,
      isActive: model.isActive,
    }
  }

  fromModel() {
    return SubscriberModel.fromModel(this)
  }
}

export class SubscriberDto extends PickType(SubscriberModel, [
  'id',
  'nationalId',
  'isActive',
]) {}
