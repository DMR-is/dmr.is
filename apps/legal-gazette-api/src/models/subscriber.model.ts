import { Column, DataType, DefaultScope } from 'sequelize-typescript'

import { ApiProperty, PickType } from '@nestjs/swagger'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'

export type SubscriberAttributes = {
  id: string
  nationalId: string
  name: string | null
  isActive: boolean
  subscribedAt: Date | null
}

export type SubscriberCreateAttributes = {
  id?: string
  nationalId: string
  name?: string | null
  isActive?: boolean
  subscribedAt?: Date | null
}

@BaseTable({ tableName: LegalGazetteModels.SUBSCRIBER })
@DefaultScope(() => ({
  attributes: ['id', 'nationalId', 'name', 'isActive', 'subscribedAt'],
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
    type: DataType.TEXT,
    field: 'name',
    allowNull: true,
  })
  @ApiProperty({ type: String, nullable: true })
  name!: string | null

  @Column({
    type: DataType.BOOLEAN,
    field: 'is_active',
    allowNull: false,
    defaultValue: false,
  })
  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @Column({
    type: DataType.DATE,
    field: 'subscribed_at',
    allowNull: true,
  })
  @ApiProperty({ type: Date, nullable: true })
  subscribedAt!: Date | null

  static fromModel(model: SubscriberModel): SubscriberDto {
    return {
      id: model.id,
      nationalId: model.nationalId,
      name: model.name,
      isActive: model.isActive,
      subscribedAt: model.subscribedAt,
    }
  }

  fromModel() {
    return SubscriberModel.fromModel(this)
  }
}

export class SubscriberDto extends PickType(SubscriberModel, [
  'id',
  'nationalId',
  'name',
  'isActive',
  'subscribedAt',
]) {}
